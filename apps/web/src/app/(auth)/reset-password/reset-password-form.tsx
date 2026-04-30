'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { performReset } from './actions';

const inputBase =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink-soft)] focus:bg-[var(--color-surface)]';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">Новый пароль</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Придумай надёжный — минимум 8 символов.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Новый пароль
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
            minLength={8}
            placeholder="••••••••"
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Повторите
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
            minLength={8}
            placeholder="••••••••"
            className={inputBase}
          />
        </div>
      </div>

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
        disabled={isPending || !token}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98] disabled:opacity-60"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </motion.form>
  );
}
