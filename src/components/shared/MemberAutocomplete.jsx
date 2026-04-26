import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUnit } from '../../hooks/useUnit';
import { normalizeForSearch } from '../../utils/textSearch';
import { sortMemberNames } from '../../utils/memberNames';

/**
 * Custom autocomplete for member selection with accent-insensitive search.
 * Replaces native <datalist> to support searching for "leon" to find "Leônidas"
 * and "cafe" to find "café".
 *
 * @param {string} value - Current input value
 * @param {Function} onChange - Callback when value changes (value) => void
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes for the input
 * @param {boolean} autoFocus - Whether to auto-focus the input on mount
 */
export default function MemberAutocomplete({
  value = '',
  onChange,
  placeholder = 'Nome',
  className = '',
  autoFocus = false,
}) {
  const { members } = useUnit();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const listboxId = `member-autocomplete-list-${useId()}`;

  const names = useMemo(() => {
    if (!members?.length) return [];
    const uniq = new Set();
    for (const m of members) {
      if (m.active === false) continue;
      const name = m.name || m.fullName;
      if (name) uniq.add(name);
    }
    return sortMemberNames(Array.from(uniq));
  }, [members]);

  const searchTerm = normalizeForSearch(value.trim());

  const filteredNames = useMemo(() => {
    if (!searchTerm) return names;
    return names.filter((name) => normalizeForSearch(name).includes(searchTerm));
  }, [names, searchTerm]);

  // Reset highlight when the filtered list changes so the highlighted index
  // can never point past the end of the new list (would otherwise break
  // ArrowDown/Enter after typing).
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredNames]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

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

  // The dropdown is rendered in a portal with position: fixed so it can escape
  // ancestors with `overflow: hidden` (e.g. the `.card` wrapper). Recompute its
  // viewport position whenever it opens and on scroll/resize while open.
  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, filteredNames.length]);

  function handleKeyDown(event) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' && filteredNames.length > 0) {
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
          prev < filteredNames.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredNames[highlightedIndex]) {
          onChange(filteredNames[highlightedIndex]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  function handleSelect(name) {
    onChange(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="member-autocomplete">
      <input
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-autocomplete="list"
      />
      {isOpen &&
        filteredNames.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="member-autocomplete-dropdown"
            id={listboxId}
            role="listbox"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            {filteredNames.map((name, index) => (
              <div
                key={name}
                className={`member-autocomplete-option${
                  index === highlightedIndex ? ' highlighted' : ''
                }`}
                onMouseDown={(e) => {
                  // Prevent the input from losing focus (which would fire
                  // onBlur and close the dropdown before onClick fires).
                  e.preventDefault();
                  handleSelect(name);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {name}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
