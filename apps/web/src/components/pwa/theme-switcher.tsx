'use client';

import { useSyncExternalStore } from 'react';

import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type Theme, persistTheme } from '@/lib/theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: '☀️ Светлая' },
  { value: 'dark', label: '🌙 Тёмная' },
  { value: 'system', label: '🖥 Авто' },
];

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  const onCustom = () => cb();
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onCustom);
  };
}

function getSnapshot(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeSwitcher({ initial }: { initial?: Theme }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme: Theme = stored ?? initial ?? 'system';

  return (
    <div className="flex gap-1 rounded-2xl bg-[var(--color-panel)] p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            void persistTheme(o.value);
          }}
          className={`press-scale rounded-xl px-3 py-1.5 text-sm transition-colors ${
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
