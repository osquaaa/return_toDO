'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-md)] text-sm font-medium text-[var(--color-fg-primary)] backdrop-blur-xl',
          title: 'text-sm font-medium',
          description: 'text-xs text-[var(--color-fg-secondary)]',
          success: 'border-[var(--color-success)]/30 bg-[var(--color-success-soft)]',
          error: 'border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]',
        },
      }}
    />
  );
}
