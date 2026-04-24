import { useEffect, useRef, useState } from 'react';

/**
 * Three-dot overflow menu. Closes on outside click, Escape, or when the
 * caller invokes the `close` function passed to the `children` render prop.
 *
 * Accepts children either as a React node or a function `({ close }) => node`.
 */
export default function KebabMenu({
  children,
  label = 'Mais ações',
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const body = typeof children === 'function' ? children({ close }) : children;

  return (
    <div
      className="kebab-menu"
      data-align={align}
      data-open={open ? 'true' : 'false'}
      ref={wrapRef}
    >
      <button
        type="button"
        className="kebab-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {open && (
        <div className="kebab-panel" role="menu">
          {body}
        </div>
      )}
    </div>
  );
}
