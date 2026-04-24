import ChamadosDialog from './ChamadosDialog';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Single-line-by-default textarea that grows to fit wrapped text. Used in
 * place of `<input type="text">` for dynamic-table cells so long values
 * (e.g. chamado names) are fully visible instead of horizontally truncated.
 */
function AutoGrowTextarea({ value, onChange, placeholder, list, autoComplete, className }) {
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
      // Allow the browser to fall back to input-like behavior where it can.
      list={list}
      autoComplete={autoComplete}
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
 */
export default function DynamicTable({
  columns,
  rows,
  onChange,
  addLabel = '+ Adicionar linha',
  unitType = 'ramo',
}) {
  const [pickerRow, setPickerRow] = useState(-1);
  const [pickerCol, setPickerCol] = useState(-1);

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
            <tr key={rowIdx}>
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
                // text (optionally with chamado picker / member autocomplete)
                return (
                  <td key={colIdx}>
                    <AutoGrowTextarea
                      className="dyn-table-textarea"
                      placeholder={col.ph}
                      value={value}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      list={col.datalistId || undefined}
                      autoComplete={col.datalistId ? 'off' : undefined}
                    />
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
