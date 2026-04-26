/**
 * Reusable search and filter bar component.
 * 
 * @param {string} searchTerm - Current search term
 * @param {Function} onSearchChange - Callback when search changes: (value) => void
 * @param {string} searchPlaceholder - Placeholder text for search input
 * @param {Array} filterOptions - Array of filter options [{value, label}]
 * @param {string} filterValue - Current selected filter value
 * @param {Function} onFilterChange - Callback when filter changes: (value) => void
 * @param {string} filterLabel - Label for the filter dropdown
 * @param {string} searchInputId - ID for the search input (for keyboard shortcuts)
 * @param {string} className - Additional CSS classes
 */
export default function SearchFilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filterOptions = [],
  filterValue = '',
  onFilterChange,
  filterLabel = 'Filtrar',
  searchInputId,
  className = '',
}) {
  return (
    <div className={`search-filter-bar ${className}`}>
      <input
        id={searchInputId}
        type="text"
        className="search-filter-input"
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label={searchPlaceholder}
      />
      
      {filterOptions.length > 0 && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="search-filter-select"
          aria-label={filterLabel}
        >
          <option value="">Todos</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
