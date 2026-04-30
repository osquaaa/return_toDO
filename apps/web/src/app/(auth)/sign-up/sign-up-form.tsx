'use client';

import { AlertCircle, ArrowRight, Check, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

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
    <div>
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
            <path d="M20 2v4" />
            <path d="M22 4h-4" />
            <circle cx="4" cy="20" r="2" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-tight">LETget</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Создать аккаунт
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
          30 секунд — и можно перестать всё держать в голове.
        </p>
      </div>

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
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Имя
          </label>
          <Input
            name="name"
            required
            autoComplete="name"
            placeholder="Иван"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputSize="lg"
            iconLeft={<User size={16} />}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Email
          </label>
          <Input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputSize="lg"
            iconLeft={<Mail size={16} />}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Пароль
          </label>
          <Input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouched(true)}
            inputSize="lg"
            iconLeft={<Lock size={16} />}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Повторите
          </label>
          <Input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            inputSize="lg"
            iconLeft={<Lock size={16} />}
          />
        </div>

        {touched && !allChecksPass && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {checks.map((c) => (
              <li
                key={c.label}
                className={cn(
                  'flex items-center gap-1.5',
                  c.ok ? 'text-[var(--color-success)]' : 'text-[var(--color-fg-tertiary)]',
                )}
              >
                <span
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-full transition-colors',
                    c.ok
                      ? 'bg-[var(--color-success)] text-white'
                      : 'border border-[var(--color-border-strong)]',
                  )}
                >
                  {c.ok && <Check size={9} strokeWidth={3.5} />}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-3 py-2.5 text-sm text-[var(--color-danger)]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          disabled={!canSubmit}
          iconRight={!isPending ? <ArrowRight size={16} /> : undefined}
        >
          {isPending ? 'Создаём…' : 'Создать аккаунт'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-fg-secondary)]">
        Уже есть аккаунт?{' '}
        <Link
          href="/sign-in"
          className="font-medium text-[var(--color-fg-primary)] hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}
