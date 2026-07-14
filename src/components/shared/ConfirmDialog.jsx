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
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: '400px' }}
      >
        <div className="cd-header cd-header--flush">
          <h3>{title}</h3>
          <button className="cd-close" onClick={onCancel} type="button" aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="cd-body">
          {message}
        </div>
        <div className="cd-footer cd-footer--flush">
          <button type="button" className="btn btn-ghost-dark" onClick={onCancel}>
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
