import { ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/lib/auth/session';

export async function Topbar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app)]/80 px-4 backdrop-blur-xl md:h-16 md:px-6">
      {/* Mobile-only brand mark; on desktop sidebar holds the brand */}
      <Link href="/tasks" className="flex items-center gap-2 lg:hidden">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-xs)]">
          <Sparkles size={14} strokeWidth={2.6} className="text-[var(--color-brand-fg)]" />
        </span>
        <span className="text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
          LETget
        </span>
      </Link>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 text-xs font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <ShieldCheck size={14} className="text-[var(--color-brand-from)]" />
              <span className="hidden sm:inline">Админ</span>
            </Link>
          )}

          {/* Desktop sidebar already shows the user card — only show on mobile/tablet here */}
          <Link href="/settings" aria-label="Профиль и настройки" className="lg:hidden">
            <Avatar
              name={user.name}
              email={user.email}
              size="sm"
              className="ring-2 ring-[var(--color-border-subtle)] ring-offset-2 ring-offset-[var(--color-bg-app)] transition-all hover:ring-[var(--color-fg-tertiary)]"
            />
          </Link>
        </div>
      )}
    </header>
  );
}
