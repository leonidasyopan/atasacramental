/**
 * Reusable pagination component with Previous/Next navigation.
 * 
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback when page changes: (newPage) => void
 * @param {string} className - Additional CSS classes
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;

  function handlePrevious() {
    onPageChange(Math.max(1, currentPage - 1));
  }

  function handleNext() {
    onPageChange(Math.min(totalPages, currentPage + 1));
  }

  return (
    <div className={`pagination ${className}`}>
      <button
        type="button"
        className="btn btn-ghost-dark btn-sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="pagination-info">
        Página {currentPage} de {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost-dark btn-sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </div>
  );
}
