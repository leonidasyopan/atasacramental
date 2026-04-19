import { useMemo } from 'react';
import { lookupHymn } from '../../data/hymns';

export default function HymnLookup({ num, onChange, placeholder = 'Nº' }) {
  const name = useMemo(() => lookupHymn(num) || '', [num]);

  return (
    <div className="hymn-group">
      <input
        type="number"
        placeholder={placeholder}
        min={1}
        max={1210}
        value={num || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="hymn-name"
        readOnly
        placeholder="Nome do hino"
        value={name}
      />
    </div>
  );
}
