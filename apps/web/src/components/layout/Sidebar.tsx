import { Sparkles } from 'lucide-react';

import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] p-4 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2 pt-2">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Sparkles size={18} strokeWidth={2.5} className="text-[var(--color-brand-fg)]" />
        </div>
        <div>
          <div className="text-base leading-tight font-semibold tracking-tight">LETget</div>
          <div className="text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            Daily ops
          </div>
        </div>
      </div>
      <SidebarNav />
    </aside>
  );
}
