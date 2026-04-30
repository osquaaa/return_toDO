import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <aside className="hidden w-[220px] flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:flex">
      <SidebarNav />
    </aside>
  );
}
