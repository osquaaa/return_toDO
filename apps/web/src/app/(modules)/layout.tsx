import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { MigrateListener } from '@/components/migration/migrate-listener';

export default function ModulesLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <MigrateListener />
      {children}
    </AppShell>
  );
}
