'use client';

import { motion } from 'framer-motion';
import { Loader2, Mail, MailCheck } from 'lucide-react';
import { useState, useTransition } from 'react';

import { requestReset } from './actions';

const inputBase =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink-soft)] focus:bg-[var(--color-surface)]';

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 py-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
          className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-tasks-from)] to-[var(--color-tasks-to)] shadow-[var(--shadow-md)]"
        >
          <MailCheck size={26} strokeWidth={2.5} className="text-white" />
        </motion.div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Проверь почту</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Если такой email есть в системе, мы отправили инструкцию для сброса.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await requestReset(Object.fromEntries(fd));
          setDone(true);
        });
      }}
      className="space-y-4"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">Сброс пароля</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Введи email — пришлём ссылку для сброса.
        </p>
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
            className={inputBase}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98] disabled:opacity-60"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? 'Отправляем…' : 'Прислать ссылку'}
      </button>
    </motion.form>
  );
}
