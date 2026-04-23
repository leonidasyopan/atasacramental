import { useState } from 'react';

export default function VisitorEntry({ visitors, onAdd, onRemove }) {
  const [description, setDescription] = useState('');
  const [count, setCount] = useState(1);

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = description.trim();
    const safeCount = Number(count);
    if (!trimmed || !Number.isFinite(safeCount) || safeCount <= 0) return;
    onAdd({ description: trimmed, count: Math.floor(safeCount) });
    setDescription('');
    setCount(1);
  }

  return (
    <div className="attendance-visitor-section">
      <h3>Visitantes</h3>

      {visitors.length === 0 && (
        <p className="attendance-visitor-empty">Nenhum visitante adicionado.</p>
      )}

      {visitors.length > 0 && (
        <ul className="attendance-visitor-list">
          {visitors.map((v, idx) => (
            <li key={`${v.description}-${idx}`} className="attendance-visitor-row">
              <span className="attendance-visitor-desc">{v.description}</span>
              <span className="attendance-visitor-count">{v.count}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRemove(idx)}
                aria-label={`Remover ${v.description}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="attendance-visitor-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Descrição (ex: Família visitante)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          min="1"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          aria-label="Quantidade de visitantes"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Adicionar
        </button>
      </form>
    </div>
  );
}
