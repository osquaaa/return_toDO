'use client';

import { AlertCircle, ArrowRight, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import { performReset } from './actions';

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

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const checks = useMemo(
    () => checkPassword(password, confirmPassword),
    [password, confirmPassword],
  );
  const allChecksPass = checks.every((c) => c.ok);
  const canSubmit = !!token && allChecksPass && !isPending;

  return (
    <div>
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Lock size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">LETget</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Новый пароль
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
          Придумай надёжный — потом не вспоминай.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!canSubmit) return;
          startTransition(async () => {
            const res = await performReset({ password, confirmPassword, token });
            if (!res.ok) setError(res.error);
            else router.push('/sign-in?reset=1');
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Новый пароль
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

        {!token && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] px-3 py-2.5 text-sm text-[var(--color-warning)]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>Токен не найден — открой ссылку из письма.</span>
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
          {isPending ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-fg-secondary)]">
        Вернуться ко{' '}
        <Link
          href="/sign-in"
          className="font-medium text-[var(--color-fg-primary)] hover:underline"
        >
          входу
        </Link>
      </p>
    </div>
  );
}
