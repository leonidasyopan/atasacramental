import { useUnit } from '../../hooks/useUnit';

const OTHER = '__outro__';

/**
 * Select populated from unit.leaders + "Outro" option.
 * If value is the special OTHER sentinel, caller should render a text input for custom name.
 */
export default function LeaderSelect({ value, onChange }) {
  const { leaders } = useUnit();
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Selecione —</option>
      {leaders.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
      <option value={OTHER}>Outro / Preencher</option>
    </select>
  );
}

export { OTHER };
