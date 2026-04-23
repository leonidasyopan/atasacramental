export default function AttendanceSummary({
  date,
  memberCount,
  visitorCount,
  total,
  searchValue,
  onSearchChange,
}) {
  return (
    <div className="attendance-sticky-header">
      <div className="attendance-summary-row">
        <div className="attendance-summary-title">
          <h2>Frequência Detalhada</h2>
          <p className="attendance-date">{date}</p>
        </div>
        <div className="attendance-summary-totals">
          <div className="attendance-summary-total" aria-label="Total de presentes">
            <span className="attendance-summary-total-value">{total}</span>
            <span className="attendance-summary-total-label">Total</span>
          </div>
          <div className="attendance-summary-breakdown">
            <span>{memberCount} membros</span>
            <span>{visitorCount} visitantes</span>
          </div>
        </div>
      </div>
      <input
        type="search"
        className="attendance-search"
        placeholder="Buscar família ou membro..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
