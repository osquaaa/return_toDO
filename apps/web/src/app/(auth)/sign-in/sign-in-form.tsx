'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { signIn } from './actions';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)]';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await signIn(Object.fromEntries(fd));
          if (!res.ok) setError(res.error);
          else router.push('/');
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Email</span>
        <input type="email" name="email" required className={inputCls} />
      </label>
      <label className="block">
        <span className="text-sm">Пароль</span>
        <input type="password" name="password" required className={inputCls} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-[var(--color-canvas)] disabled:opacity-50"
      >
        {isPending ? 'Входим…' : 'Войти'}
      </button>
      <div className="flex justify-between text-xs text-[var(--color-ink-soft)]">
        <Link href="/forgot-password" className="underline">
          Забыл пароль
        </Link>
        <Link href="/sign-up" className="underline">
          Создать аккаунт
        </Link>
      </div>
    </form>
  );
}
