import { Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';

import { MobileDrawer } from './mobile-drawer';
import { SidebarNav } from './sidebar-nav';
import { SignOutButton } from './sign-out-button';

export async function Topbar() {
  const user = await getCurrentUser();

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('')
    : (user?.email[0]?.toUpperCase() ?? '?');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 px-4 backdrop-blur-xl lg:px-8">
      <MobileDrawer>
        <SidebarNav />
      </MobileDrawer>

      <div className="relative flex-1 max-w-xl">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
        />
        <input
          type="search"
          placeholder="Найти что-нибудь…"
          className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink-soft)] focus:outline-none"
        />
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition-transform hover:scale-105 sm:flex"
            >
              <ShieldCheck size={14} />
              Админ
            </Link>
          )}
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium md:inline">{user.name ?? user.email}</span>
            <SignOutButton />
          </div>
        </div>
      )}
    </header>
  );
}
