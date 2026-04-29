'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { signUp } from './actions';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await signUp(Object.fromEntries(fd));
          if (!res.ok) setError(res.error);
          else router.push('/verify-email/sent');
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Имя</span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Пароль</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Повторите пароль</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-white disabled:opacity-50"
      >
        {isPending ? 'Создаём…' : 'Создать аккаунт'}
      </button>
      <p className="text-center text-sm text-[var(--color-ink)]/70">
        Уже есть аккаунт?{' '}
        <Link href="/sign-in" className="underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
