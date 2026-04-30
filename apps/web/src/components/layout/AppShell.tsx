import type { ReactNode } from 'react';

import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './Sidebar';
import { SidebarRail } from './SidebarRail';
import { Topbar } from './Topbar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[var(--color-bg-app)]">
      <Sidebar />
      <SidebarRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
