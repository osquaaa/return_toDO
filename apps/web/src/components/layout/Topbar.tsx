import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';

import { MobileDrawer } from './mobile-drawer';
import { SidebarNav } from './sidebar-nav';
import { SignOutButton } from './sign-out-button';

export async function Topbar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 px-4 backdrop-blur lg:px-6">
      <MobileDrawer>
        <SidebarNav />
      </MobileDrawer>
      <div className="flex-1">
        <input
          type="search"
          placeholder="Поиск по всему…"
          className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-brand-from)] focus:outline-none"
        />
      </div>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-lg px-2 py-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
            >
              Админ
            </Link>
          )}
          <span className="text-[var(--color-ink-soft)]">{user.name ?? user.email}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
