import { Sparkles } from 'lucide-react';

import { SidebarNav } from './sidebar-nav';

export function SidebarRail() {
  return (
    <aside className="hidden w-16 shrink-0 flex-col items-center border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] py-4 md:flex lg:hidden">
      <div className="mb-6 flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
        <Sparkles size={18} strokeWidth={2.5} className="text-[var(--color-brand-fg)]" />
      </div>
      <SidebarNav variant="rail" />
    </aside>
  );
}
