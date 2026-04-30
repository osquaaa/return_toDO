'use client';

import { useEffect, useState, type ReactNode } from 'react';

type Props = { children: ReactNode };

export function MobileDrawer({ children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Меню"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-panel)] lg:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute top-0 left-0 flex h-full w-[260px] flex-col bg-[var(--color-panel)] p-4 shadow-xl"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('a')) setOpen(false);
            }}
          >
            {children}
          </aside>
        </div>
      )}
    </>
  );
}
