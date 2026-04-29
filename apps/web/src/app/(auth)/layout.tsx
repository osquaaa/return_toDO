import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[var(--color-cream-50)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white/70 p-8 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl text-[var(--color-ink)]">LETget</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
