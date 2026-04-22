import { useMemo } from 'react';
import { useUnit } from '../../hooks/useUnit';

/**
 * Renders a single <datalist> populated with the active members of the unit.
 * Inputs in the same page can opt into autocomplete by setting `list={id}`
 * on them. Names are sorted by family then given name (pt-BR collation) to
 * make the dropdown predictable.
 *
 * HTML allows only one datalist per id per page, so this component should be
 * rendered once near the top of the form tree.
 */
export default function MembersDatalist({ id = 'members-datalist' }) {
  const { members } = useUnit();

  const names = useMemo(() => {
    if (!members?.length) return [];
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    const uniq = new Set();
    for (const m of members) {
      if (m.active === false) continue;
      const name = m.name || m.fullName;
      if (name) uniq.add(name);
    }
    return Array.from(uniq).sort((a, b) => {
      const [ga = '', fa = ''] = splitName(a);
      const [gb = '', fb = ''] = splitName(b);
      const cmp = collator.compare(fa, fb);
      if (cmp !== 0) return cmp;
      return collator.compare(ga, gb);
    });
  }, [members]);

  return (
    <datalist id={id}>
      {names.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}

function splitName(full) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return [full, ''];
  const given = parts[0];
  const family = parts.slice(1).join(' ');
  return [given, family];
}
