'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/cn';
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type Theme, persistTheme } from '@/lib/theme';

type Option = {
  value: Theme;
  label: string;
  icon: LucideIcon;
  preview: { bg: string; surface: string; ink: string };
};

const OPTIONS: Option[] = [
  {
    value: 'light',
    label: 'Светлая',
    icon: Sun,
    preview: { bg: '#fbf8f1', surface: '#ffffff', ink: '#18181b' },
  },
  {
    value: 'dark',
    label: 'Тёмная',
    icon: Moon,
    preview: { bg: '#0a0a0b', surface: '#18181b', ink: '#fafafa' },
  },
  {
    value: 'system',
    label: 'Авто',
    icon: Monitor,
    preview: {
      bg: 'linear-gradient(135deg, #fbf8f1 50%, #0a0a0b 50%)',
      surface: '#27272a',
      ink: '#a1a1aa',
    },
  },
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
    <div className="grid grid-cols-3 gap-2.5">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => void persistTheme(o.value)}
            className={cn(
              'group relative flex flex-col items-stretch gap-2 rounded-2xl border p-2.5 text-left transition-all',
              active
                ? 'border-[var(--color-brand-from)] shadow-[var(--shadow-sm)]'
                : 'border-[var(--color-border-default)] hover:border-[var(--color-fg-tertiary)]',
            )}
          >
            <div
              className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border-subtle)] p-2"
              style={{ background: o.preview.bg }}
            >
              <div className="flex h-1.5 gap-1">
                <span className="size-1.5 rounded-full bg-red-400/70" />
                <span className="size-1.5 rounded-full bg-amber-400/70" />
                <span className="size-1.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="space-y-1">
                <div
                  className="h-1.5 w-3/4 rounded-full"
                  style={{ background: o.preview.surface }}
                />
                <div
                  className="h-1.5 w-1/2 rounded-full opacity-60"
                  style={{ background: o.preview.surface }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-fg-primary)]">
                <Icon size={13} strokeWidth={2.4} className="text-[var(--color-fg-secondary)]" />
                {o.label}
              </span>
              {active && (
                <span className="size-1.5 rounded-full bg-[var(--color-brand-from)]" aria-hidden />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
