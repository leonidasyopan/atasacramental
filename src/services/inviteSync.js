import {
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  DEFAULT_ATA,
  atasRef,
  getDraftByDate,
  serializeAtaForFirestore,
  deserializeAtaFromFirestore,
} from './atas';

/**
 * Glue between Talk Invites and Ata drafts.
 *
 * Two responsibilities:
 *   1. Lazy draft creation — creating an invite for a date guarantees a draft
 *      exists for that Sunday. The leader can also create one by editing.
 *   2. Speaker auto-fill — when an invite reaches status 'aceito', its speaker
 *      info populates rowsDisc[position-1] in the corresponding draft.
 *      Manually-typed rows are protected: each auto-filled row carries a
 *      `linkedInviteId` (in the parallel `rowsDiscOwners` field) that lets us
 *      detect ownership for safe overwrite/clear.
 *
 * Invariant: a row is touched by inviteSync ONLY if it is empty OR its current
 * `linkedInviteId` matches the invite we are syncing. Manual edits clobber
 * the linkedInviteId, which permanently locks the row from auto-fill.
 */

const EMPTY_ROW = ['', '', ''];

function isRowEmpty(row) {
  if (!Array.isArray(row)) return true;
  return !row[0] && !row[1] && !row[2];
}

/**
 * Get-or-create a draft for the given Sunday. Idempotent for normal use.
 *
 * Race note: the existence check and addDoc are not atomic. Two near-
 * simultaneous calls for the same date can create duplicate drafts. The
 * dashboard de-duplicates by date in render (first wins), and the leader
 * can delete the duplicate from history if needed. Acceptable trade-off
 * for unit-scale concurrency.
 */
export async function ensureDraftForDate(unitId, dateISO) {
  if (!unitId || !dateISO) return null;
  const existing = await getDraftByDate(unitId, dateISO);
  if (existing) return existing;
  const payload = {
    ...serializeAtaForFirestore(DEFAULT_ATA),
    data: dateISO,
    mode: 'disc',
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(atasRef(unitId), payload);
  return { id: ref.id, ...DEFAULT_ATA, data: dateISO, mode: 'disc', status: 'draft' };
}

/**
 * Inside a transaction, mutate one draft document via `mutator(current)`.
 * Mutator receives the deserialized current state and returns a partial
 * patch (or null to abort). The patch is serialized and written with
 * updatedAt bumped.
 */
async function mutateDraft(unitId, draftId, mutator) {
  const docRef = doc(atasRef(unitId), draftId);
  return runTransaction(db, async (txn) => {
    const snap = await txn.get(docRef);
    if (!snap.exists()) return false;
    const current = deserializeAtaFromFirestore(snap.data());
    const patch = mutator(current);
    if (!patch) return false;
    txn.update(docRef, {
      ...serializeAtaForFirestore(patch),
      updatedAt: serverTimestamp(),
    });
    return true;
  });
}

/**
 * Clear a slot in the given draft IFF it is currently owned by `ownerInviteId`.
 * No-op otherwise (manual edits and other invites' rows are preserved).
 */
async function clearSlotIfOwned(unitId, dateISO, position, ownerInviteId) {
  if (!dateISO || !position || !ownerInviteId) return;
  const positionIdx = Number(position) - 1;
  if (!Number.isInteger(positionIdx) || positionIdx < 0) return;
  const draft = await getDraftByDate(unitId, dateISO);
  if (!draft) return;

  await mutateDraft(unitId, draft.id, (current) => {
    const owners = Array.isArray(current.rowsDiscOwners) ? [...current.rowsDiscOwners] : [];
    if (owners[positionIdx]?.linkedInviteId !== ownerInviteId) return null;

    const rowsDisc = Array.isArray(current.rowsDisc) ? current.rowsDisc.map((r) => [...(r || [])]) : [];
    if (positionIdx < rowsDisc.length) rowsDisc[positionIdx] = [...EMPTY_ROW];
    owners[positionIdx] = null;
    return { rowsDisc, rowsDiscOwners: owners };
  });
}

/**
 * Fill rowsDisc[position-1] in the given draft from `invite`, but only if
 * the slot is empty or already owned by this invite (preserves manual edits).
 */
async function fillSlotFromInvite(unitId, draftId, invite) {
  const positionIdx = Number(invite.position) - 1;
  if (!Number.isInteger(positionIdx) || positionIdx < 0) return;

  await mutateDraft(unitId, draftId, (current) => {
    const rowsDisc = Array.isArray(current.rowsDisc) ? current.rowsDisc.map((r) => [...(r || [])]) : [];
    const owners = Array.isArray(current.rowsDiscOwners) ? [...current.rowsDiscOwners] : [];
    while (rowsDisc.length <= positionIdx) rowsDisc.push([...EMPTY_ROW]);
    while (owners.length <= positionIdx) owners.push(null);

    const existing = rowsDisc[positionIdx];
    const linkedInviteId = owners[positionIdx]?.linkedInviteId;
    const ownedByThis = linkedInviteId === invite.id;
    if (!isRowEmpty(existing) && !ownedByThis) return null;

    rowsDisc[positionIdx] = [
      invite.memberName || '',
      invite.topic || '',
      invite.duration ? String(invite.duration) : '',
    ];
    owners[positionIdx] = { linkedInviteId: invite.id };
    return { rowsDisc, rowsDiscOwners: owners };
  });
}

/**
 * Single entry point used by every invite mutation flow.
 *
 * @param {string} unitId
 * @param {object|null} invite - the new invite state (null when deleting)
 * @param {object|null} prevInvite - the previous invite state (null for new invites)
 *
 * Behavior:
 *  - Cleanup: if prevInvite owned a slot AND the slot's identity changed
 *    (date/position moved, status flipped to recusado, or invite deleted),
 *    auto-clear the OLD slot (only if owned by prevInvite.id).
 *  - Ensure draft exists for invite's dataAlvo (creates lazily for any status).
 *  - Auto-fill: only when invite.status === 'aceito' AND invite.position set.
 *  - mode='test' on existing draft: do NOT auto-flip (dashboard alerts surface this).
 */
export async function syncInviteToDraft(unitId, invite, prevInvite = null) {
  if (!unitId) return;

  // Step 1: cleanup old slot if prevInvite previously owned one and identity changed.
  if (prevInvite?.dataAlvo && prevInvite?.position && prevInvite?.id) {
    const deleted = !invite;
    const rejected = invite && invite.status === 'recusado';
    const dateMoved = invite && invite.dataAlvo && invite.dataAlvo !== prevInvite.dataAlvo;
    const positionMoved = invite && invite.position && String(invite.position) !== String(prevInvite.position);
    if (deleted || rejected || dateMoved || positionMoved) {
      await clearSlotIfOwned(unitId, prevInvite.dataAlvo, prevInvite.position, prevInvite.id);
    }
  }

  // Step 2: deletion has nothing more to do.
  if (!invite) return;
  if (!invite.dataAlvo) return;

  // Step 3: ensure draft exists for the invite's date (any status triggers this).
  const draft = await ensureDraftForDate(unitId, invite.dataAlvo);
  if (!draft) return;

  // Step 4: auto-fill only when accepted with a position.
  if (invite.status !== 'aceito') return;
  if (!invite.position) return;
  await fillSlotFromInvite(unitId, draft.id, invite);
}

/**
 * Convenience wrapper: creates an invite then syncs to draft.
 * Sync errors are swallowed (logged) so a successful invite save isn't blocked
 * by a transient sync failure — the invite remains the source of truth.
 */
export async function safeSyncInviteToDraft(unitId, invite, prevInvite = null) {
  try {
    await syncInviteToDraft(unitId, invite, prevInvite);
    return { ok: true };
  } catch (err) {
    console.error('syncInviteToDraft failed:', err);
    return { ok: false, error: err };
  }
}
