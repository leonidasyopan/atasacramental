import { useEffect, useMemo, useState } from 'react';
import { getCallings, CALLING_GROUP_LABELS } from '../../data/callings';

export default function ChamadosDialog({ unitType = 'ramo', onPick, onClose }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const callings = useMemo(() => getCallings(unitType), [unitType]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entries = useMemo(() => {
    const all = [];
    Object.entries(callings).forEach(([key, list]) => {
      list.forEach((name) => all.push({ category: key, name }));
    });
    const filtered = all.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return filtered;
  }, [callings, category, search]);

  return (
    <div
      className="cd-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="cd-dialog" role="dialog" aria-label="Selecionar Chamado">
        <div className="cd-header">
          <h3>Selecionar Chamado</h3>
          <button className="cd-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="cd-search-wrap">
          <input
            type="text"
            className="cd-search"
            placeholder="Buscar chamado..."
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cd-categories">
          <button
            type="button"
            className={`cd-cat-btn${category === 'all' ? ' active' : ''}`}
            onClick={() => setCategory('all')}
          >
            Todos
          </button>
          {Object.entries(CALLING_GROUP_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`cd-cat-btn${category === key ? ' active' : ''}`}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="cd-list">
          {entries.length === 0 && <div className="cd-empty">Nenhum chamado encontrado.</div>}
          {entries.map((e, i) => (
            <button
              key={`${e.category}-${e.name}-${i}`}
              type="button"
              className="cd-item"
              onClick={() => onPick?.(e.name)}
            >
              <span className="cd-item-name">{e.name}</span>
              <span className="cd-item-cat">{CALLING_GROUP_LABELS[e.category]}</span>
            </button>
          ))}
        </div>
        <div className="cd-footer">
          <button type="button" className="btn btn-ghost" onClick={() => onPick?.('')}>
            Limpar campo
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
