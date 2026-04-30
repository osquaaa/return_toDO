import { Sparkles } from 'lucide-react';

import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <aside className="hidden w-[240px] flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] p-5 lg:flex">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Sparkles size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight leading-tight">LETget</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">
            Daily ops
          </div>
        </div>
      </div>
      <SidebarNav />
      <div className="mt-auto rounded-xl bg-[var(--color-canvas)]/60 p-3 text-xs text-[var(--color-ink-faint)]">
        Лаконично. Понятно. На каждый день.
      </div>
    </aside>
  );
}
