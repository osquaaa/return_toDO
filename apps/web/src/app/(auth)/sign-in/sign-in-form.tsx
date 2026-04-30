'use client';

import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
          С возвращением
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
          Войди чтобы продолжить работу со своими списками.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get('email') ?? '').trim();
          const password = String(fd.get('password') ?? '');
          if (!email || !password) {
            setError('Заполни email и пароль');
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              const res = await fetch('/api/auth/sign-in/email', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
              });
              if (res.ok) {
                router.push('/');
                router.refresh();
                return;
              }
              const data = (await res.json().catch(() => null)) as { message?: string } | null;
              const code = data?.message ?? '';
              if (code.toLowerCase().includes('verif'))
                setError('Email не подтверждён. Проверь почту.');
              else if (res.status === 429) setError('Слишком много попыток. Подожди 15 минут.');
              else setError(code || 'Неверный email или пароль');
            } catch {
              setError('Сеть недоступна. Попробуй ещё раз.');
            }
          });
        }}
        className="space-y-4"
      >
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
            inputSize="lg"
            iconLeft={<Mail size={16} />}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
              Пароль
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]"
            >
              Забыл?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            inputSize="lg"
            iconLeft={<Lock size={16} />}
          />
        </div>

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
          iconRight={!isPending ? <ArrowRight size={16} /> : undefined}
        >
          {isPending ? 'Входим…' : 'Войти'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-fg-secondary)]">
        Нет аккаунта?{' '}
        <Link
          href="/sign-up"
          className="font-medium text-[var(--color-fg-primary)] hover:underline"
        >
          Создать
        </Link>
      </p>
    </div>
  );
}
