import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--color-canvas)] px-4 py-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-gradient-to-br from-[var(--color-brand-from)]/30 to-[var(--color-brand-to)]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-gradient-to-br from-[var(--color-tasks-from)]/20 to-[var(--color-shopping-from)]/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-md)]">
            <Sparkles size={22} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">LETget</h1>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Списки и заметки на каждый день
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/80 p-7 shadow-[var(--shadow-lg)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </main>
  );
}
