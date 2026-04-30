'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Check, Circle, Loader2, Lock, Mail, User } from 'lucide-react';
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

const inputBase =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink-soft)] focus:bg-[var(--color-surface)]';

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
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Имя
        </label>
        <div className="relative">
          <User
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Как тебя называть"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Пароль
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouched(true)}
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Повторите пароль
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            type="password"
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      {touched && !allChecksPass && (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs"
        >
          {checks.map((c) => (
            <li
              key={c.label}
              className={`flex items-center gap-1.5 ${c.ok ? 'text-emerald-600' : 'text-[var(--color-ink-soft)]'}`}
            >
              {c.ok ? <Check size={12} strokeWidth={3} /> : <Circle size={12} strokeWidth={2} />}
              {c.label}
            </li>
          ))}
        </motion.ul>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? 'Создаём…' : 'Создать аккаунт'}
      </button>

      <p className="pt-1 text-center text-xs text-[var(--color-ink-soft)]">
        Уже есть аккаунт?{' '}
        <Link href="/sign-in" className="font-medium text-[var(--color-ink)] hover:underline">
          Войти →
        </Link>
      </p>
    </motion.form>
  );
}
