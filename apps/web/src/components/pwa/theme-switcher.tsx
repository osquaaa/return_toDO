'use client';

import { useEffect, useState } from 'react';

import { type Theme, persistTheme } from '@/lib/theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: '☀️ Светлая' },
  { value: 'dark', label: '🌙 Тёмная' },
  { value: 'system', label: '🖥 Авто' },
];

export function ThemeSwitcher({ initial }: { initial?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial ?? 'system');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const stored = (localStorage.getItem('letget:theme') as Theme | null) ?? initial ?? 'system';
    setTheme(stored);
  }, [initial]);

  return (
    <div className="flex gap-1 rounded-2xl bg-[var(--color-panel)] p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            setTheme(o.value);
            void persistTheme(o.value);
          }}
          className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
            theme === o.value
              ? 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--color-ink-soft)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
