import { useEffect } from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="cd-overlay anim-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="cd-dialog anim-slide-up"
        role="dialog"
        aria-label={title}
        style={{ maxWidth: '400px' }}
      >
        <div className="cd-header" style={{ borderBottom: 'none', paddingBottom: '4px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</h3>
          <button className="cd-close" onClick={onCancel} type="button" aria-label="Fechar">
            ×
          </button>
        </div>
        <div style={{ padding: '8px 20px 24px', fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>
          {message}
        </div>
        <div
          className="cd-footer"
          style={{ borderTop: 'none', gap: '10px', justifyContent: 'flex-end', paddingTop: '0' }}
        >
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button autoFocus type="button" className="btn btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
