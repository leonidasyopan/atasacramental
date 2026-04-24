/**
 * Normalize a string for case- and accent-insensitive searches.
 *
 * Uses Unicode NFD decomposition to split accented characters into a base
 * letter + combining mark, then strips the combining marks. `ã` → `a`,
 * `é` → `e`, `ç` → `c`, etc. Also lowercases the result and collapses
 * nullish inputs to an empty string.
 *
 * Use on both the haystack and the needle so that searching for "leon"
 * matches "Leônidas" and "cafe" matches "café".
 */
export function normalizeForSearch(value) {
  if (value == null) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
