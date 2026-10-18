import RecognitionAutocomplete from './RecognitionAutocomplete';

function IconTrash() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function RecognitionTable({
  rows = [],
  onChange,
  suggestions = [],
  onDeleteSuggestion,
}) {
  function updateCell(rowIdx, colIdx, val) {
    const next = rows.map((r, i) =>
      i === rowIdx
        ? [colIdx === 0 ? val : r[0] || '', colIdx === 1 ? val : r[1] || '']
        : r,
    );
    onChange(next);
  }

  function updateRow(rowIdx, name, calling) {
    const next = rows.map((r, i) =>
      i === rowIdx ? [name, calling] : r,
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, ['', '']]);
  }

  function removeRow(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <div className="recognition-table-container">
      <table className="dyn-table recognition-table">
        <thead>
          <tr>
            <th style={{ width: '55%' }}>Nome / Autoridade</th>
            <th style={{ width: '40%' }}>Chamado</th>
            <th style={{ width: 34 }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="recognition-table-empty">
                Nenhum reconhecimento adicionado para esta ata.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td>
                  <RecognitionAutocomplete
                    value={row[0] || ''}
                    onChange={(val) => updateCell(rowIdx, 0, val)}
                    onSelect={(suggestion) =>
                      updateRow(rowIdx, suggestion.name, suggestion.calling || '')
                    }
                    suggestions={suggestions}
                    onDeleteSuggestion={onDeleteSuggestion}
                    placeholder="Nome da autoridade / visitante"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Chamado (ex: Presidente da Estaca)"
                    value={row[1] || ''}
                    onChange={(e) => updateCell(rowIdx, 1, e.target.value)}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="row-del-btn"
                    onClick={() => removeRow(rowIdx)}
                    title="Remover linha"
                    aria-label={`Remover linha ${rowIdx + 1}`}
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <button
        type="button"
        className="add-row-btn"
        onClick={addRow}
      >
        + Adicionar reconhecimento
      </button>
    </div>
  );
}
