import { useState } from 'react';

function IconPencil() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function VisitorEntry({ visitors, onAdd, onRemove, onEdit }) {
  const [description, setDescription] = useState('');
  const [count, setCount] = useState(1);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editCount, setEditCount] = useState(1);

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = description.trim();
    const safeCount = Number(count);
    if (!trimmed || !Number.isFinite(safeCount) || safeCount <= 0) return;
    onAdd({ description: trimmed, count: Math.floor(safeCount) });
    setDescription('');
    setCount(1);
  }

  function startEdit(idx, v) {
    setEditingIdx(idx);
    setEditDesc(v.description);
    setEditCount(v.count);
  }

  function cancelEdit() {
    setEditingIdx(null);
  }

  function saveEdit(idx) {
    const trimmed = editDesc.trim();
    const safeCount = Number(editCount);
    if (!trimmed || !Number.isFinite(safeCount) || safeCount <= 0) return;
    onEdit(idx, { description: trimmed, count: Math.floor(safeCount) });
    setEditingIdx(null);
  }

  function handleEditKeyDown(e, idx) {
    if (e.key === 'Enter') saveEdit(idx);
    if (e.key === 'Escape') cancelEdit();
  }

  return (
    <div className="attendance-visitor-section">
      <h3>Visitantes</h3>

      {visitors.length === 0 && (
        <p className="attendance-visitor-empty">Nenhum visitante adicionado.</p>
      )}

      {visitors.length > 0 && (
        <ul className="attendance-visitor-list">
          {visitors.map((v, idx) =>
            editingIdx === idx ? (
              <li key={`${v.description}-${idx}`} className="attendance-visitor-row editing">
                <input
                  className="visitor-edit-input"
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, idx)}
                  autoFocus
                  aria-label="Descrição do visitante"
                />
                <input
                  className="visitor-edit-input visitor-edit-count"
                  type="number"
                  min="1"
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, idx)}
                  aria-label="Quantidade"
                />
                <button
                  type="button"
                  className="visitor-icon-btn visitor-icon-btn--save"
                  onClick={() => saveEdit(idx)}
                  data-tooltip="Salvar"
                  aria-label="Salvar"
                >
                  <IconCheck />
                </button>
                <button
                  type="button"
                  className="visitor-icon-btn visitor-icon-btn--cancel"
                  onClick={cancelEdit}
                  data-tooltip="Cancelar"
                  aria-label="Cancelar"
                >
                  <IconX />
                </button>
              </li>
            ) : (
              <li key={`${v.description}-${idx}`} className="attendance-visitor-row">
                <span className="attendance-visitor-desc">{v.description}</span>
                <span className="attendance-visitor-count">{v.count}</span>
                <button
                  type="button"
                  className="visitor-icon-btn visitor-icon-btn--edit"
                  onClick={() => startEdit(idx, v)}
                  data-tooltip="Editar"
                  aria-label={`Editar ${v.description}`}
                >
                  <IconPencil />
                </button>
                <button
                  type="button"
                  className="visitor-icon-btn visitor-icon-btn--delete"
                  onClick={() => onRemove(idx)}
                  data-tooltip="Remover"
                  aria-label={`Remover ${v.description}`}
                >
                  <IconTrash />
                </button>
              </li>
            )
          )}
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
