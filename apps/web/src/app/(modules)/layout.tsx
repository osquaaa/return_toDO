import type { ReactNode } from 'react';

import { MigrateListener } from '@/components/migration/migrate-listener';

export default function ModulesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MigrateListener />
      {children}
    </>
  );
}
