'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status = { linked: false } | { linked: true; username: string | null; linkedAt: string };

export function TelegramCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [linkInfo, setLinkInfo] = useState<{ deepLink: string } | null>(null);

  const refresh = async () => {
    const r = await fetch('/api/telegram/status');
    setStatus((await r.json()) as Status);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetch('/api/telegram/status');
      const data = (await r.json()) as Status;
      if (!cancelled) setStatus(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!linkInfo) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [linkInfo]);

  // Derive: hide link card once Telegram is linked.
  const showLinkInfo = !status?.linked && linkInfo;

  if (!status) {
    return (
      <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-canvas)]">
            <Send size={16} strokeWidth={2.2} className="text-[var(--color-ink-soft)]" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">Telegram</h2>
        </div>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">Загрузка…</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
      <header className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-canvas)]">
          <Send size={16} strokeWidth={2.2} className="text-[var(--color-ink-soft)]" />
        </div>
        <h2 className="text-base font-semibold tracking-tight">Telegram</h2>
        {status.linked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 size={12} strokeWidth={2.4} />
            подключено
          </span>
        )}
      </header>

      {status.linked ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Привязан как{' '}
            <span className="font-mono font-medium">@{status.username ?? 'unknown'}</span>
          </p>
          <button
            onClick={async () => {
              await fetch('/api/telegram/unlink', { method: 'POST' });
              await refresh();
            }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            Отвязать
          </button>
        </div>
      ) : showLinkInfo && linkInfo ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-[var(--color-ink-soft)]">
            Открой ссылку и нажми «Start» в боте:
          </p>
          <a
            href={linkInfo.deepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] px-4 text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
          >
            <Send size={14} />
            Открыть бота
          </a>
          <p className="text-xs text-[var(--color-ink-faint)]">Ссылка живёт 10 минут.</p>
        </div>
      ) : (
        <button
          onClick={async () => {
            const r = await fetch('/api/telegram/link-token', { method: 'POST' });
            setLinkInfo((await r.json()) as { deepLink: string });
          }}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] px-4 text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
        >
          <Send size={14} />
          Подключить Telegram
        </button>
      )}
    </section>
  );
}
