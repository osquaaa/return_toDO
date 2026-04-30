import { ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/lib/auth/session';

import { SignOutButton } from './sign-out-button';

export async function Topbar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app)]/85 px-4 backdrop-blur-xl md:h-16 md:px-6">
      {/* Mobile-only brand mark */}
      <Link href="/tasks" className="flex items-center gap-2 md:hidden">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Sparkles size={14} strokeWidth={2.5} className="text-[var(--color-brand-fg)]" />
        </span>
        <span className="text-base font-semibold tracking-tight">LETget</span>
      </Link>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] px-3 text-xs font-semibold text-[var(--color-brand-fg)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-100 sm:flex"
            >
              <ShieldCheck size={14} />
              Админ
            </Link>
          )}
          <div className="flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-1 pl-1.5">
            <Avatar name={user.name} email={user.email} size="sm" />
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-[var(--color-fg-primary)] lg:inline">
              {user.name ?? user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      )}
    </header>
  );
}
