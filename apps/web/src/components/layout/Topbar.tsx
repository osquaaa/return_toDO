import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';

import { SignOutButton } from './sign-out-button';

export async function Topbar() {
  const user = await getCurrentUser();
  return (
    <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-[--color-border] bg-[--color-canvas]/80 backdrop-blur sticky top-0 z-10">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Поиск по всему…"
          className="w-full max-w-md px-3 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-brand-from]"
        />
      </div>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-lg px-2 py-1 text-[--color-ink-soft] hover:bg-[--color-panel] hover:text-[--color-ink]"
            >
              Админ
            </Link>
          )}
          <span className="text-[--color-ink-soft]">{user.name ?? user.email}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
