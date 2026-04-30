'use client';

import { RotateCcw, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';

import { cancelNotificationAction, retryNotificationAction } from './actions';

type Props = { id: string; canRetry: boolean; canCancel: boolean };

export function NotificationRowActions({ id, canRetry, canCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmRetry, setConfirmRetry] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="flex justify-end gap-1">
      {canRetry && (
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<RotateCcw size={11} />}
          disabled={isPending}
          onClick={() => setConfirmRetry(true)}
        >
          Retry
        </Button>
      )}
      {canCancel && (
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<X size={11} />}
          disabled={isPending}
          onClick={() => setConfirmCancel(true)}
        >
          Отменить
        </Button>
      )}

      <ConfirmDialog
        open={confirmRetry}
        onClose={() => setConfirmRetry(false)}
        title="Перезапустить отправку?"
        description="Уведомление снова попадёт в очередь."
        confirmLabel="Retry"
        loading={isPending}
        onConfirm={async () => {
          startTransition(async () => {
            const r = await retryNotificationAction(id);
            setConfirmRetry(false);
            if (r.ok) toast.success('Перезапущено');
            else toast.error(r.error);
          });
        }}
      />

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Отменить отправку?"
        description="Уведомление не будет отправлено."
        confirmLabel="Отменить отправку"
        variant="danger"
        loading={isPending}
        onConfirm={async () => {
          startTransition(async () => {
            const r = await cancelNotificationAction(id);
            setConfirmCancel(false);
            if (r.ok) toast.success('Отменено');
            else toast.error(r.error);
          });
        }}
      />
    </div>
  );
}
