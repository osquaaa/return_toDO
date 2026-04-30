'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { signUp } from './actions';

type Check = { label: string; ok: boolean };

function checkPassword(pwd: string, confirm: string): Check[] {
  return [
    { label: '8+ символов', ok: pwd.length >= 8 },
    { label: 'строчная буква', ok: /[a-z]/.test(pwd) },
    { label: 'заглавная буква', ok: /[A-Z]/.test(pwd) },
    { label: 'цифра', ok: /[0-9]/.test(pwd) },
    { label: 'пароли совпадают', ok: pwd.length > 0 && pwd === confirm },
  ];
}

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-ink-soft)]';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const checks = useMemo(
    () => checkPassword(password, confirmPassword),
    [password, confirmPassword],
  );
  const allChecksPass = checks.every((c) => c.ok);
  const canSubmit = name.trim().length > 0 && email.includes('@') && allChecksPass && !isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!canSubmit) return;
        startTransition(async () => {
          const res = await signUp({ name, email, password, confirmPassword });
          if (!res.ok) setError(res.error);
          else router.push('/verify-email/sent');
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Имя</span>
        <input
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Пароль</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setTouched(true)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Повторите пароль</span>
        <input
          type="password"
          name="confirmPassword"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputCls}
        />
      </label>

      {touched && !allChecksPass && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {checks.map((c) => (
            <li
              key={c.label}
              className={c.ok ? 'text-emerald-600' : 'text-[var(--color-ink-soft)]'}
            >
              <span className="mr-1">{c.ok ? '✓' : '○'}</span>
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-sm font-medium text-[var(--color-canvas)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? 'Создаём…' : 'Создать аккаунт'}
      </button>

      <p className="text-center text-sm text-[var(--color-ink-soft)]">
        Уже есть аккаунт?{' '}
        <Link href="/sign-in" className="font-medium text-[var(--color-ink)] underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
