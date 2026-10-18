import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeForSearch } from '../../utils/textSearch';

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function VisitorAutocomplete({
  value = '',
  onChange,
  onSelect,
  suggestions = [],
  onDeleteSuggestion,
  placeholder = 'Descrição (ex: Família visitante)',
  className = '',
  'aria-label': ariaLabel = 'Descrição do visitante',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 200 });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const listboxId = `visitor-autocomplete-list-${useId()}`;

  const searchTerm = normalizeForSearch(value.trim());

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    if (!searchTerm) {
      // Show up to 15 suggestions on focus before typing
      return suggestions.slice(0, 15);
    }
    return suggestions
      .filter((s) => normalizeForSearch(s.name).includes(searchTerm))
      .slice(0, 20);
  }, [suggestions, searchTerm]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update floating dropdown position
  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 210 && rect.top > 210;
      const maxHeight = Math.min(220, Math.max(120, openUpward ? rect.top - 16 : spaceBelow - 16));

      setDropdownPos({
        top: openUpward ? Math.max(8, rect.top - maxHeight - 4) : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, filteredSuggestions.length]);

  function handleKeyDown(event) {
    if (!isOpen) {
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && filteredSuggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          event.preventDefault();
          handleSelect(filteredSuggestions[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  }

  function handleSelect(suggestion) {
    if (onSelect) {
      onSelect(suggestion);
    } else if (onChange) {
      onChange(suggestion.name);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="visitor-autocomplete">
      <input
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen && filteredSuggestions.length > 0}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
      />

      {isOpen &&
        filteredSuggestions.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="visitor-autocomplete-dropdown"
            id={listboxId}
            role="listbox"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                className={`visitor-autocomplete-option${
                  index === highlightedIndex ? ' highlighted' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <span className="visitor-autocomplete-name">{suggestion.name}</span>

                {suggestion.count > 1 && (
                  <span
                    className="visitor-autocomplete-badge"
                    title={`Quantidade habitual: ${suggestion.count}`}
                  >
                    {suggestion.count}
                  </span>
                )}

                {onDeleteSuggestion && (
                  <button
                    type="button"
                    className="visitor-autocomplete-delete-btn"
                    title={`Remover "${suggestion.name}" das sugestões`}
                    aria-label={`Remover sugestão ${suggestion.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteSuggestion(suggestion.name);
                    }}
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
