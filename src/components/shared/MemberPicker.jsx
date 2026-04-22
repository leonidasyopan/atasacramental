import { useMemo } from 'react';
import { useUnit } from '../../hooks/useUnit';

/**
 * Select populated from unit.members. Value is the member's name.
 * Falls back to a text input when no members are loaded.
 */
export default function MemberPicker({ value, onChange, placeholder = 'Selecione um membro' }) {
  const { members } = useUnit();

  const sorted = useMemo(() => {
    if (!members) return [];
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    return [...members].sort((a, b) => {
      const famA = a.familyName || a.name || '';
      const famB = b.familyName || b.name || '';
      const cmp = collator.compare(famA, famB);
      if (cmp !== 0) return cmp;
      return collator.compare(a.givenName || a.name || '', b.givenName || b.name || '');
    });
  }, [members]);

  if (!sorted.length) {
    return (
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— {placeholder} —</option>
      {sorted.map((m) => (
        <option key={m.id} value={m.name}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
