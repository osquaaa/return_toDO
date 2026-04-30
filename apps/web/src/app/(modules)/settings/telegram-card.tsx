'use client';

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
      <section className="rounded-3xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
        Загрузка…
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
      <h2 className="text-lg font-medium">Telegram</h2>
      {status.linked ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">
            Привязан как <span className="font-mono">@{status.username ?? 'unknown'}</span>
          </p>
          <button
            onClick={async () => {
              await fetch('/api/telegram/unlink', { method: 'POST' });
              await refresh();
            }}
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-canvas)]"
          >
            Отвязать
          </button>
        </div>
      ) : showLinkInfo && linkInfo ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">Открой ссылку и нажми «Start» в боте:</p>
          <a
            href={linkInfo.deepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-canvas)]"
          >
            Открыть бота
          </a>
          <p className="text-xs text-[var(--color-ink-soft)]">Ссылка живёт 10 минут.</p>
        </div>
      ) : (
        <button
          onClick={async () => {
            const r = await fetch('/api/telegram/link-token', { method: 'POST' });
            setLinkInfo((await r.json()) as { deepLink: string });
          }}
          className="mt-3 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-canvas)]"
        >
          Подключить Telegram
        </button>
      )}
    </section>
  );
}
