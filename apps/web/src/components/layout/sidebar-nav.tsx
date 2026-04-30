'use client';

import {
  CheckCircle2,
  Code2,
  Dumbbell,
  Repeat,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/tasks',
    label: 'Задачи',
    icon: CheckCircle2,
    accent: 'var(--color-accent-tasks)',
    accentSoft: 'var(--color-accent-tasks-soft)',
  },
  {
    href: '/habits',
    label: 'Привычки',
    icon: Repeat,
    accent: 'var(--color-accent-habits)',
    accentSoft: 'var(--color-accent-habits-soft)',
  },
  {
    href: '/shopping',
    label: 'Покупки',
    icon: ShoppingBag,
    accent: 'var(--color-accent-shopping)',
    accentSoft: 'var(--color-accent-shopping-soft)',
  },
  {
    href: '/code',
    label: 'Код',
    icon: Code2,
    accent: 'var(--color-accent-code)',
    accentSoft: 'var(--color-accent-code-soft)',
  },
  {
    href: '/workouts',
    label: 'Тренировки',
    icon: Dumbbell,
    accent: 'var(--color-accent-workouts)',
    accentSoft: 'var(--color-accent-workouts-soft)',
  },
  {
    href: '/settings',
    label: 'Настройки',
    icon: Settings,
    accent: 'var(--color-fg-primary)',
    accentSoft: 'var(--color-bg-subtle)',
  },
];

type Props = { variant?: 'full' | 'rail' };

export function SidebarNav({ variant = 'full' }: Props) {
  const pathname = usePathname();
  return (
    <nav className={cn('flex flex-col', variant === 'full' ? 'gap-0.5' : 'gap-1.5 items-center')}>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        if (variant === 'rail') {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'group relative flex size-11 items-center justify-center rounded-xl transition-all',
                active ? 'shadow-[var(--shadow-xs)]' : 'hover:bg-[var(--color-bg-hover)]',
              )}
              style={active ? { background: item.accentSoft } : undefined}
            >
              <Icon
                size={20}
                strokeWidth={2.2}
                style={active ? { color: item.accent } : { color: 'var(--color-fg-secondary)' }}
              />
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              active ? '' : 'hover:bg-[var(--color-bg-hover)]',
            )}
            style={active ? { background: item.accentSoft } : undefined}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={
                active
                  ? { background: item.accent, color: 'white' }
                  : {
                      background: 'var(--color-bg-subtle)',
                      color: 'var(--color-fg-secondary)',
                    }
              }
            >
              <Icon size={15} strokeWidth={2.4} />
            </span>
            <span
              className="flex-1"
              style={
                active
                  ? { color: 'var(--color-fg-primary)' }
                  : { color: 'var(--color-fg-secondary)' }
              }
            >
              {item.label}
            </span>
            {active && (
              <span
                className="size-1.5 rounded-full"
                style={{ background: item.accent }}
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
