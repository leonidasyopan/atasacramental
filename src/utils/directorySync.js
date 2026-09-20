import { normalizeForSearch } from './textSearch';

/**
 * Compare two values for equality in the context of member directory updates.
 * Handles null/undefined and string trims.
 */
function areEqual(val1, val2) {
  if (val1 === val2) return true;
  if (val1 == null && val2 == null) return true;
  if (typeof val1 === 'string' && typeof val2 === 'string') {
    return val1.trim() === val2.trim();
  }
  return false;
}

/**
 * Computes the differential synchronization between imported directory data
 * and existing Firestore records.
 *
 * Pure function — no Firebase dependencies.
 *
 * @param {object} params
 * @param {Array} params.parsedMembers - Members extracted from the Excel spreadsheet
 * @param {Array} params.parsedHouseholds - Households extracted from the Excel spreadsheet
 * @param {Array} params.existingMembers - Current members in the unit Firestore
 * @param {Array} params.existingHouseholds - Current households in the unit Firestore
 * @param {object} [params.options]
 * @param {boolean} [params.options.deactivateMissing=true] - Whether to soft-deactivate missing members
 * @returns {object} Diff calculation with additions, updates, unchanged, and missing items
 */
export function computeDirectoryDiff({
  parsedMembers = [],
  parsedHouseholds = [],
  existingMembers = [],
  existingHouseholds = [],
  options = {},
}) {
  const { deactivateMissing = true } = options;

  // 1. Build lookup maps for existing households
  // Match by id or normalized name
  const existingHouseholdByName = new Map();
  for (const h of existingHouseholds) {
    if (h.name) existingHouseholdByName.set(normalizeForSearch(h.name), h);
    if (h.displayName) existingHouseholdByName.set(normalizeForSearch(h.displayName), h);
  }

  // 2. Reconcile households
  const householdMatches = new Map(); // parsedHousehold.tempId -> existingHousehold.id
  const householdsToAdd = [];
  const householdsToUpdate = [];
  const householdsUnchanged = [];
  const matchedExistingHouseholdIds = new Set();

  for (const ph of parsedHouseholds) {
    const normName = normalizeForSearch(ph.name || '');
    const normDisplay = normalizeForSearch(ph.displayName || '');
    const existing = existingHouseholdByName.get(normName) || existingHouseholdByName.get(normDisplay);

    if (existing) {
      householdMatches.set(ph.tempId, existing.id);
      matchedExistingHouseholdIds.add(existing.id);

      const changes = {};
      if (!areEqual(ph.name, existing.name)) changes.name = ph.name;
      if (!areEqual(ph.displayName, existing.displayName)) changes.displayName = ph.displayName;
      if (!areEqual(ph.headNames, existing.headNames)) changes.headNames = ph.headNames;
      if (!areEqual(ph.address, existing.address)) changes.address = ph.address;
      if (!areEqual(ph.phone, existing.phone)) changes.phone = ph.phone;
      if (!areEqual(ph.email, existing.email)) changes.email = ph.email;
      if (existing.active === false) changes.active = true;

      if (Object.keys(changes).length > 0) {
        householdsToUpdate.push({
          id: existing.id,
          name: ph.name,
          changes,
          current: existing,
        });
      } else {
        householdsUnchanged.push(existing);
      }
    } else {
      householdsToAdd.push(ph);
    }
  }

  const householdsMissing = existingHouseholds
    .filter((h) => !matchedExistingHouseholdIds.has(h.id) && h.active !== false)
    .map((h) => ({
      id: h.id,
      name: h.name || h.displayName || 'Família',
      current: h,
    }));

  // 3. Build lookup maps for existing members
  // Match by id, exact name, or originalLcrName
  const existingMemberByName = new Map();
  for (const m of existingMembers) {
    if (m.name) existingMemberByName.set(normalizeForSearch(m.name), m);
    if (m.fullName) existingMemberByName.set(normalizeForSearch(m.fullName), m);
    if (m.originalLcrName) existingMemberByName.set(normalizeForSearch(m.originalLcrName), m);
  }

  // 4. Reconcile members
  const membersToAdd = [];
  const membersToUpdate = [];
  const membersUnchanged = [];
  const matchedExistingMemberIds = new Set();

  for (const pm of parsedMembers) {
    const normName = normalizeForSearch(pm.name || '');
    const normLcr = normalizeForSearch(pm.originalLcrName || '');
    const existing = existingMemberByName.get(normName) || existingMemberByName.get(normLcr);

    if (existing) {
      matchedExistingMemberIds.add(existing.id);

      const resolvedHouseholdId = pm.tempHouseholdId
        ? householdMatches.get(pm.tempHouseholdId) || pm.tempHouseholdId
        : existing.householdId || null;

      const changes = {};
      if (!areEqual(pm.name, existing.name)) changes.name = pm.name;
      if (pm.originalLcrName && !areEqual(pm.originalLcrName, existing.originalLcrName)) {
        changes.originalLcrName = pm.originalLcrName;
      }
      if (pm.gender && !areEqual(pm.gender, existing.gender)) changes.gender = pm.gender;
      if (pm.age != null && !areEqual(pm.age, existing.age)) changes.age = pm.age;
      if (pm.birthDate && !areEqual(pm.birthDate, existing.birthDate)) changes.birthDate = pm.birthDate;
      if (pm.phone && !areEqual(pm.phone, existing.phone)) changes.phone = pm.phone;
      if (pm.email && !areEqual(pm.email, existing.email)) changes.email = pm.email;
      if (pm.householdRole && !areEqual(pm.householdRole, existing.householdRole)) {
        changes.householdRole = pm.householdRole;
      }
      if (resolvedHouseholdId && !areEqual(resolvedHouseholdId, existing.householdId)) {
        changes.householdId = resolvedHouseholdId;
      }
      if (existing.active === false) changes.active = true;

      if (Object.keys(changes).length > 0) {
        membersToUpdate.push({
          id: existing.id,
          name: pm.name,
          changes,
          current: existing,
        });
      } else {
        membersUnchanged.push(existing);
      }
    } else {
      membersToAdd.push(pm);
    }
  }

  const membersMissing = existingMembers
    .filter((m) => !matchedExistingMemberIds.has(m.id) && m.active !== false)
    .map((m) => ({
      id: m.id,
      name: m.name,
      current: m,
    }));

  return {
    households: {
      toAdd: householdsToAdd,
      toUpdate: householdsToUpdate,
      unchanged: householdsUnchanged,
      missing: householdsMissing,
    },
    members: {
      toAdd: membersToAdd,
      toUpdate: membersToUpdate,
      unchanged: membersUnchanged,
      missing: membersMissing,
    },
    householdMatches, // Map of tempId -> existingId
    stats: {
      totalParsedMembers: parsedMembers.length,
      totalParsedHouseholds: parsedHouseholds.length,
      membersToAddCount: membersToAdd.length,
      membersToUpdateCount: membersToUpdate.length,
      membersUnchangedCount: membersUnchanged.length,
      membersMissingCount: membersMissing.length,
      householdsToAddCount: householdsToAdd.length,
      householdsToUpdateCount: householdsToUpdate.length,
      householdsUnchangedCount: householdsUnchanged.length,
      householdsMissingCount: householdsMissing.length,
    },
    options: { deactivateMissing },
  };
}
