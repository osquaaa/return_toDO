import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-[var(--color-bg-app)] lg:grid-cols-[1.1fr_1fr]">
      {/* Hero — left on desktop, hidden on mobile */}
      <aside className="relative hidden overflow-hidden bg-[var(--color-fg-primary)] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,138,61,0.35)_0%,transparent_50%),radial-gradient(100%_70%_at_100%_100%,rgba(255,85,119,0.30)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.45)_100%)]" />

        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8a3d] to-[#ff5577] shadow-[0_8px_32px_rgba(255,138,61,0.4)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </svg>
            </div>
            <div className="text-xl font-semibold tracking-tight">LETget</div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-balance text-[56px] font-semibold leading-[1.05] tracking-tight">
              Списки
              <br />
              для тех, кто
              <br />
              <span className="bg-gradient-to-r from-[#ffb347] via-[#ff8a3d] to-[#ff5577] bg-clip-text text-transparent">
                не любит хаос
              </span>
              .
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
              Задачи, покупки, заметки и тренировки — в одном пространстве. Синхронизация с
              Telegram, темная тема, мгновенный поиск.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/50">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Все системы работают
            </span>
            <span>v0.1 · Phase 1</span>
          </div>
        </div>
      </aside>

      {/* Form side */}
      <section className="flex items-center justify-center px-5 py-12 lg:px-12">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
