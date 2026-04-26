/**
 * Utility functions for processing and sorting member names.
 * Shared between MembersDatalist and MemberAutocomplete to avoid code duplication.
 */

/**
 * Split a full name into given name and family name.
 * Assumes Portuguese naming convention: given name(s) followed by family name(s).
 *
 * @param {string} full - Full name
 * @returns {[string, string]} [givenName, familyName]
 */
export function splitName(full) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return [full, ''];
  const given = parts[0];
  const family = parts.slice(1).join(' ');
  return [given, family];
}

/**
 * Sort member names by family name first, then given name, using Portuguese collation.
 *
 * @param {string[]} names - Array of names to sort
 * @returns {string[]} Sorted array of names
 */
export function sortMemberNames(names) {
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
  return [...names].sort((a, b) => {
    const [ga = '', fa = ''] = splitName(a);
    const [gb = '', fb = ''] = splitName(b);
    const cmp = collator.compare(fa, fb);
    if (cmp !== 0) return cmp;
    return collator.compare(ga, gb);
  });
}
