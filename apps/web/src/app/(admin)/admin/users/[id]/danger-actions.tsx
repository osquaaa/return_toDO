'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteUserAction, forceLogoutAction, updateUserRoleAction } from './actions';

type Props = { userId: string; email: string; role: string; isSelf: boolean };

export function DangerActions({ userId, email, role, isSelf }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const expected = `DELETE ${email}`;

  const doForceLogout = () => {
    if (!confirm('Разлогинить этого пользователя?')) return;
    startTransition(async () => {
      const r = await forceLogoutAction(userId);
      setError(r.ok ? null : r.error);
    });
  };

  const doToggleRole = () => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Сменить роль на "${newRole}"?`)) return;
    startTransition(async () => {
      const r = await updateUserRoleAction(userId, newRole);
      setError(r.ok ? null : r.error);
    });
  };

  const doDelete = () => {
    startTransition(async () => {
      const r = await deleteUserAction(userId, confirmPhrase);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setError(null);
      setShowConfirm(false);
      router.push('/admin/users');
    });
  };

  return (
    <section className="rounded-2xl border border-red-300 bg-red-50/40 p-4">
      <h2 className="mb-3 font-medium text-red-900">Опасные действия</h2>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={doForceLogout}
          disabled={isPending}
          className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm hover:bg-red-100 disabled:opacity-50"
        >
          Force logout
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={doToggleRole}
            disabled={isPending}
            className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm hover:bg-red-100 disabled:opacity-50"
          >
            Сменить роль ({role === 'admin' ? 'снять админа' : 'сделать админом'})
          </button>
        )}
        {!isSelf && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
            className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            Удалить юзера
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="mt-4 rounded-xl border border-red-300 bg-white p-3">
          <p className="text-sm">
            Введи <code className="rounded bg-[var(--color-canvas)] px-1">{expected}</code> для
            подтверждения:
          </p>
          <input
            type="text"
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={doDelete}
              disabled={isPending || confirmPhrase !== expected}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Удалить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmPhrase('');
              }}
              className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--color-canvas)]"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
