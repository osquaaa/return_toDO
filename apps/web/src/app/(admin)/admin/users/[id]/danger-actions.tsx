'use client';

import { AlertTriangle, LogOut, Shield, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { deleteUserAction, forceLogoutAction, updateUserRoleAction } from './actions';

type Props = { userId: string; email: string; role: string; isSelf: boolean };

export function DangerActions({ userId, email, role, isSelf }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmRole, setConfirmRole] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const expected = `DELETE ${email}`;
  const newRole = role === 'admin' ? 'user' : 'admin';

  return (
    <section className="rounded-3xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]/40 p-5 md:p-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <AlertTriangle size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
            Опасные действия
          </h2>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Отменить большинство из них нельзя.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          iconLeft={<LogOut size={14} />}
          disabled={isPending}
          onClick={() => setConfirmLogout(true)}
        >
          Force logout
        </Button>
        {!isSelf && (
          <Button
            variant="secondary"
            size="md"
            iconLeft={<Shield size={14} />}
            disabled={isPending}
            onClick={() => setConfirmRole(true)}
          >
            {role === 'admin' ? 'Снять админа' : 'Сделать админом'}
          </Button>
        )}
        {!isSelf && (
          <Button
            variant="danger"
            size="md"
            iconLeft={<Trash2 size={14} />}
            disabled={isPending}
            onClick={() => setDeleteOpen(true)}
          >
            Удалить юзера
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Разлогинить пользователя?"
        description="Все активные сессии будут прерваны."
        confirmLabel="Разлогинить"
        variant="danger"
        loading={isPending}
        onConfirm={async () => {
          startTransition(async () => {
            const r = await forceLogoutAction(userId);
            setConfirmLogout(false);
            if (r.ok) toast.success('Сессии прерваны');
            else toast.error(r.error);
          });
        }}
      />

      <ConfirmDialog
        open={confirmRole}
        onClose={() => setConfirmRole(false)}
        title={`Сменить роль на «${newRole}»?`}
        description="Это даст или отнимет доступ к админке."
        confirmLabel="Сменить"
        variant="danger"
        loading={isPending}
        onConfirm={async () => {
          startTransition(async () => {
            const r = await updateUserRoleAction(userId, newRole);
            setConfirmRole(false);
            if (r.ok) toast.success('Роль изменена');
            else toast.error(r.error);
          });
        }}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Удалить юзера">
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-3 py-2.5 text-sm text-[var(--color-danger)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>Вместе с юзером удалятся все его данные. Действие необратимо.</span>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
              Подтверждение
            </label>
            <p className="mb-2 text-xs text-[var(--color-fg-secondary)]">
              Введи{' '}
              <code className="rounded bg-[var(--color-bg-subtle)] px-1 py-0.5 font-mono text-[11px]">
                {expected}
              </code>
              :
            </p>
            <Input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              inputSize="md"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmPhrase('');
              }}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={isPending}
              disabled={confirmPhrase !== expected}
              onClick={() => {
                startTransition(async () => {
                  const r = await deleteUserAction(userId, confirmPhrase);
                  if (r.ok) {
                    toast.success('Юзер удалён');
                    setDeleteOpen(false);
                    router.push('/admin/users');
                  } else {
                    toast.error(r.error);
                  }
                });
              }}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
