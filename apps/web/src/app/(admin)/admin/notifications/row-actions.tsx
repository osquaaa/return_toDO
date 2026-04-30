'use client';

import { useState, useTransition } from 'react';

import { cancelNotificationAction, retryNotificationAction } from './actions';

type Props = { id: string; canRetry: boolean; canCancel: boolean };

export function NotificationRowActions({ id, canRetry, canCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onRetry = () => {
    if (!confirm('Перезапустить отправку?')) return;
    startTransition(async () => {
      const r = await retryNotificationAction(id);
      setError(r.ok ? null : r.error);
    });
  };

  const onCancel = () => {
    if (!confirm('Отменить отправку?')) return;
    startTransition(async () => {
      const r = await cancelNotificationAction(id);
      setError(r.ok ? null : r.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isPending}
            className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1 text-xs hover:bg-[var(--color-canvas)] disabled:opacity-50"
          >
            Retry
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Отменить
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
