'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

import { NAV_ITEMS } from './sidebar-nav';

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/85 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 px-2 py-2"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-1 inset-y-0 rounded-2xl bg-[var(--color-bg-subtle)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={2.2}
                className="relative"
                style={active ? { color: item.accent } : { color: 'var(--color-fg-tertiary)' }}
              />
              <span
                className={cn(
                  'relative text-[10px] font-medium tracking-wide transition-colors',
                  active ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-tertiary)]',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
