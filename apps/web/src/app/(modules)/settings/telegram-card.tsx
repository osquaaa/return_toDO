'use client';

import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type Status = { linked: false } | { linked: true; username: string | null; linkedAt: string };

export function TelegramCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [linkInfo, setLinkInfo] = useState<{ deepLink: string } | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

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

  const showLinkInfo = !status?.linked && linkInfo;

  if (!status) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (status.linked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success-soft)] px-3.5 py-2.5">
          <CheckCircle2 size={16} className="shrink-0 text-[var(--color-success)]" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--color-fg-primary)]">Подключён</div>
            <div className="truncate font-mono text-xs text-[var(--color-fg-secondary)]">
              @{status.username ?? 'unknown'}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmUnlink(true)}>
          Отвязать
        </Button>
        <ConfirmDialog
          open={confirmUnlink}
          onClose={() => setConfirmUnlink(false)}
          title="Отвязать Telegram?"
          description="Push-уведомления и команды бота перестанут работать. Привязать заново можно в любое время."
          confirmLabel="Отвязать"
          variant="danger"
          loading={unlinking}
          onConfirm={async () => {
            setUnlinking(true);
            await fetch('/api/telegram/unlink', { method: 'POST' });
            await refresh();
            setUnlinking(false);
            setConfirmUnlink(false);
            toast.success('Telegram отвязан');
          }}
        />
      </div>
    );
  }

  if (showLinkInfo && linkInfo) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-accent-code)]/20 bg-[var(--color-accent-code-soft)] px-3.5 py-3">
          <div className="text-sm font-medium text-[var(--color-fg-primary)]">
            Жмите «Start» в открывшемся боте
          </div>
          <div className="mt-1 text-xs text-[var(--color-fg-secondary)]">
            Эта страница обновится автоматически. Ссылка живёт 10 минут.
          </div>
        </div>
        <a
          href={linkInfo.deepLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] px-4 text-sm font-semibold text-[var(--color-brand-fg)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
        >
          <Send size={14} />
          Открыть бота
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      iconLeft={<Send size={14} />}
      onClick={async () => {
        const r = await fetch('/api/telegram/link-token', { method: 'POST' });
        setLinkInfo((await r.json()) as { deepLink: string });
      }}
    >
      Подключить Telegram
    </Button>
  );
}
