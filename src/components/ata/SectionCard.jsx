export default function SectionCard({
  number,
  title,
  children,
  enabled = true,
  onToggle,
  onClear,
  showClear = true,
}) {
  return (
    <div className={`card${enabled ? '' : ' disabled-section'}`}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="num">{number}</div>
          <h2>{title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {showClear && onClear && (
            <button
              className="clear-section-btn"
              onClick={onClear}
              title="Limpar dados desta seção"
              type="button"
            >
              🗑 Limpar dados
            </button>
          )}
          {onToggle && (
            <label className="section-enable-toggle">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onToggle(e.target.checked)}
              />{' '}
              Incluir
            </label>
          )}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
