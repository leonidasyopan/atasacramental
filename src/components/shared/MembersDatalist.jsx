import { useMemo } from 'react';
import { useUnit } from '../../hooks/useUnit';
import { splitName, sortMemberNames } from '../../utils/memberNames';

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
    const uniq = new Set();
    for (const m of members) {
      if (m.active === false) continue;
      const name = m.name || m.fullName;
      if (name) uniq.add(name);
    }
    return sortMemberNames(Array.from(uniq));
  }, [members]);

  return (
    <datalist id={id}>
      {names.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}
