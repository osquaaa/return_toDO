'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Button } from './button';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0b]/50 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-t-3xl bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xl)] sm:rounded-3xl sm:p-6"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <X size={14} />
            </button>

            <div className="flex items-start gap-3">
              {variant === 'danger' && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-danger-soft)]">
                  <AlertTriangle size={18} className="text-[var(--color-danger)]" />
                </div>
              )}
              <div className="min-w-0 flex-1 pr-6">
                <h2 className="text-lg leading-tight font-semibold tracking-tight text-[var(--color-fg-primary)]">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1.5 text-sm text-[var(--color-fg-secondary)]">{description}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={() => void onConfirm()}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0b]/50 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-t-3xl bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xl)] sm:rounded-3xl sm:p-6"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <X size={14} />
            </button>
            {title && (
              <h2 className="mb-4 pr-6 text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
