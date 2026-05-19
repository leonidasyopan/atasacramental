import ChamadosDialog from './ChamadosDialog';
import MemberAutocomplete from './MemberAutocomplete';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Single-line-by-default textarea that grows to fit wrapped text. Used in
 * place of `<input type="text">` for dynamic-table cells without native
 * datalist autocomplete, so long values (e.g. chamado names) wrap instead
 * of truncating horizontally.
 *
 * Note: columns bound to a `<datalist>` keep using `<input type="text">`
 * because the `list` attribute is ignored on `<textarea>`.
 */
function AutoGrowTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      className={className}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      onInput={resize}
    />
  );
}

/**
 * Generic table with add/remove rows.
 *
 * @param {Array} columns - column defs: { type: 'text'|'number'|'select', ph, opts, w, chamadoPicker }
 * @param {Array<Array<string>>} rows - 2D array of cell values
 * @param {Function} onChange - (newRows) => void
 * @param {string} addLabel
 * @param {string} unitType - 'ala' | 'ramo' (for chamados picker)
 * @param {boolean} sortable - enable drag-and-drop row reordering
 * @param {Function} [onSort] - (newRows, fromIdx, toIdx) => void — called instead of onChange when
 *   a row is reordered via drag-and-drop, so callers can update parallel state (e.g. ownership arrays)
 *   without clobbering it. Falls back to onChange when omitted.
 */
export default function DynamicTable({
  columns,
  rows,
  onChange,
  addLabel = '+ Adicionar linha',
  unitType = 'ramo',
  sortable = false,
  onSort,
}) {
  const [pickerRow, setPickerRow] = useState(-1);
  const [pickerCol, setPickerCol] = useState(-1);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  function updateCell(rowIdx, colIdx, value) {
    const next = rows.map((r, i) =>
      i === rowIdx
        ? columns.map((_, j) => (j === colIdx ? value : r[j] || ''))
        : r,
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, columns.map(() => '')]);
  }

  function removeRow(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function handleDragStart(e, idx) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  }

  function handleDrop(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    if (onSort) {
      onSort(next, dragIdx, idx);
    } else {
      onChange(next);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function openPicker(rowIdx, colIdx) {
    setPickerRow(rowIdx);
    setPickerCol(colIdx);
  }

  function handlePick(value) {
    if (pickerRow >= 0 && pickerCol >= 0) {
      updateCell(pickerRow, pickerCol, value);
    }
    setPickerRow(-1);
    setPickerCol(-1);
  }

  return (
    <>
      <table className="dyn-table">
        <thead>
          <tr>
            {sortable && <th style={{ width: 24 }} />}
            {columns.map((col, i) => (
              <th key={i} style={col.w ? { width: col.w } : undefined}>
                {col.label || col.ph || ''}
              </th>
            ))}
            <th style={{ width: 34 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              draggable={sortable}
              onDragStart={sortable ? (e) => handleDragStart(e, rowIdx) : undefined}
              onDragOver={sortable ? (e) => handleDragOver(e, rowIdx) : undefined}
              onDrop={sortable ? (e) => handleDrop(e, rowIdx) : undefined}
              onDragEnd={sortable ? handleDragEnd : undefined}
              className={
                sortable
                  ? [
                      dragIdx === rowIdx ? 'row-dragging' : '',
                      dragOverIdx === rowIdx && dragIdx !== rowIdx ? 'row-drag-over' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : undefined
              }
            >
              {sortable && (
                <td className="drag-handle-cell">
                  <span className="drag-handle" title="Arrastar para reordenar" aria-hidden="true">⠿</span>
                </td>
              )}
              {columns.map((col, colIdx) => {
                const value = row[colIdx] || '';
                if (col.type === 'select') {
                  return (
                    <td key={colIdx}>
                      <select
                        value={value}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      >
                        <option value="">—</option>
                        {col.opts.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                  );
                }
                if (col.type === 'number') {
                  return (
                    <td key={colIdx}>
                      <input
                        type="number"
                        placeholder={col.ph}
                        value={value}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      />
                    </td>
                  );
                }
                // text (optionally with chamado picker / member autocomplete).
                // Columns with member autocomplete use MemberAutocomplete for
                // accent-insensitive search; others use auto-growing textarea
                // so long content wraps instead of truncating horizontally.
                return (
                  <td key={colIdx}>
                    {col.datalistId ? (
                      <MemberAutocomplete
                        value={value}
                        onChange={(v) => updateCell(rowIdx, colIdx, v)}
                        placeholder={col.ph}
                      />
                    ) : (
                      <AutoGrowTextarea
                        className="dyn-table-textarea"
                        placeholder={col.ph}
                        value={value}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      />
                    )}
                    {col.chamadoPicker && (
                      <button
                        type="button"
                        className="chamado-pick-btn"
                        onClick={() => openPicker(rowIdx, colIdx)}
                        title="Selecionar chamado da lista"
                      >
                        ⚙
                      </button>
                    )}
                  </td>
                );
              })}
              <td>
                <button
                  type="button"
                  className="row-del-btn"
                  onClick={() => removeRow(rowIdx)}
                  title="Remover linha"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={addRow} type="button">
        {addLabel}
      </button>

      {pickerRow >= 0 && (
        <ChamadosDialog
          unitType={unitType}
          onPick={handlePick}
          onClose={() => {
            setPickerRow(-1);
            setPickerCol(-1);
          }}
        />
      )}
    </>
  );
}
