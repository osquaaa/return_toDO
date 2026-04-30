'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Code2,
  Dumbbell,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

type NavItem = { href: string; label: string; icon: LucideIcon; accent: string };

export const NAV_ITEMS: NavItem[] = [
  { href: '/tasks', label: 'Задачи', icon: CheckCircle2, accent: 'var(--color-accent-tasks)' },
  {
    href: '/shopping',
    label: 'Покупки',
    icon: ShoppingBag,
    accent: 'var(--color-accent-shopping)',
  },
  { href: '/code', label: 'Код', icon: Code2, accent: 'var(--color-accent-code)' },
  {
    href: '/workouts',
    label: 'Тренировки',
    icon: Dumbbell,
    accent: 'var(--color-accent-workouts)',
  },
  { href: '/settings', label: 'Настройки', icon: Settings, accent: 'var(--color-fg-primary)' },
];

type Props = { variant?: 'full' | 'rail' };

export function SidebarNav({ variant = 'full' }: Props) {
  const pathname = usePathname();
  return (
    <nav className={cn('flex flex-col', variant === 'full' ? 'gap-1' : 'gap-2 items-center')}>
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
                'group relative flex size-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]'
                  : 'hover:bg-[var(--color-bg-hover)]',
              )}
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
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="active-pill"
                className="absolute inset-0 rounded-xl bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              size={18}
              strokeWidth={2.2}
              className="relative shrink-0"
              style={active ? { color: item.accent } : { color: 'var(--color-fg-secondary)' }}
            />
            <span
              className="relative"
              style={
                active
                  ? { color: 'var(--color-fg-primary)' }
                  : { color: 'var(--color-fg-secondary)' }
              }
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
