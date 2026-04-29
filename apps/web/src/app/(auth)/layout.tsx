import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--color-canvas)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface)]/80 p-8 shadow-[var(--shadow-md)] backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">LETget</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
