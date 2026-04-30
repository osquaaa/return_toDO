import type { ReactNode } from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/auth/session';

const NAV = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/users', label: 'Юзеры' },
  { href: '/admin/content', label: 'Контент' },
  { href: '/admin/notifications', label: 'Очередь' },
  { href: '/admin/audit', label: 'Audit log' },
  { href: '/admin/logins', label: 'Логины' },
  { href: '/admin/health', label: 'Здоровье' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-[200px] flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:flex">
        <h1 className="mb-4 text-lg font-bold tracking-tight">Админка</h1>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tasks"
          className="mt-auto rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
        >
          ← На сайт
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
