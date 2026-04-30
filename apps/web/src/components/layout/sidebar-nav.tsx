'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Code, Dumbbell, Settings, ShoppingBag, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: LucideIcon; accent: string };

const ITEMS: NavItem[] = [
  { href: '/tasks', label: 'Задачи', icon: CheckCircle2, accent: 'var(--color-tasks-from)' },
  { href: '/shopping', label: 'Покупки', icon: ShoppingBag, accent: 'var(--color-shopping-from)' },
  { href: '/code', label: 'Код', icon: Code, accent: 'var(--color-code-from)' },
  { href: '/workouts', label: 'Тренировки', icon: Dumbbell, accent: 'var(--color-workout-from)' },
  { href: '/settings', label: 'Настройки', icon: Settings, accent: 'var(--color-ink)' },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="active-pill"
                className="absolute inset-0 rounded-xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              size={18}
              strokeWidth={2.2}
              className={`relative ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]'}`}
              style={active ? { color: item.accent } : undefined}
            />
            <span
              className={`relative ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]'}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
