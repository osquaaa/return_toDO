'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

type Props = { href: string; label: string; icon: LucideIcon };

export function AdminNavLink({ href, label, icon: Icon }: Props) {
  const pathname = usePathname();
  // /admin should only match exact, others can match by prefix
  const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-primary)]'
          : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
          active
            ? 'bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)]'
            : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]',
        )}
      >
        <Icon size={15} strokeWidth={2.4} />
      </span>
      <span className="flex-1">{label}</span>
      {active && (
        <span className="size-1.5 rounded-full bg-[var(--color-brand-from)]" aria-hidden />
      )}
    </Link>
  );
}
