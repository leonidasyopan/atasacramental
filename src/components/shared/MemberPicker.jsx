import { useUnit } from '../../hooks/useUnit';

/**
 * Select populated from unit.members. Value is the member's name.
 * Falls back to a text input when no members are loaded.
 */
export default function MemberPicker({ value, onChange, placeholder = 'Selecione um membro' }) {
  const { members } = useUnit();

  if (!members || members.length === 0) {
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
      {members.map((m) => (
        <option key={m.id} value={m.name}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
