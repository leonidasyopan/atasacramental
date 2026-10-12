import { useMemo } from 'react';
import { lookupHymn } from '../../data/hymns';

export default function HymnLookup({
  num,
  onChange,
  placeholder = 'Nº',
  ariaLabel = 'Número do hino',
  'aria-label': ariaLabelProp,
}) {
  const name = useMemo(() => lookupHymn(num) || '', [num]);
  const inputAriaLabel = ariaLabelProp || ariaLabel;

  return (
    <div className="hymn-group">
      <input
        type="number"
        placeholder={placeholder}
        min={1}
        max={1210}
        value={num || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={inputAriaLabel}
      />
      <input
        type="text"
        className="hymn-name"
        readOnly
        placeholder="Nome do hino"
        value={name}
        aria-label={`Nome do hino: ${inputAriaLabel}`}
      />
    </div>
  );
}
