import { LogOut, Sparkles } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { getCurrentUser } from '@/lib/auth/session';

import { SidebarNav } from './sidebar-nav';

export async function Sidebar() {
  const user = await getCurrentUser();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <div className="relative flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Sparkles size={16} strokeWidth={2.6} className="text-[var(--color-brand-fg)]" />
        </div>
        <div className="min-w-0">
          <div className="text-base leading-tight font-semibold tracking-tight text-[var(--color-fg-primary)]">
            LETget
          </div>
          <div className="text-[10px] leading-tight tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            Daily ops · v0.1
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2">
        <div className="px-3 pb-1.5 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          Модули
        </div>
        <SidebarNav />
      </div>

      {user && (
        <div className="m-3 flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-2.5">
          <Avatar name={user.name} email={user.email} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
              {user.name ?? user.email}
            </div>
            <div className="truncate text-xs text-[var(--color-fg-tertiary)]">
              {user.role === 'admin' ? 'Админ' : 'Юзер'}
            </div>
          </div>
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              aria-label="Выйти"
              className="flex size-8 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
