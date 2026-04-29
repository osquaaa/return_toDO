'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { performReset } from './actions';

const inputCls =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)]';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await performReset({ ...Object.fromEntries(fd), token });
          if (!res.ok) setError(res.error);
          else router.push('/sign-in?reset=1');
        });
      }}
      className="space-y-4"
    >
      <h2 className="text-center text-xl font-semibold tracking-tight">Новый пароль</h2>
      <input
        type="password"
        name="password"
        required
        minLength={8}
        placeholder="Новый пароль"
        className={inputCls}
      />
      <input
        type="password"
        name="confirmPassword"
        required
        minLength={8}
        placeholder="Повторите"
        className={inputCls}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !token}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-[var(--color-canvas)] disabled:opacity-50"
      >
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}
