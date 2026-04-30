'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export function VerifyEmailView({ hasError }: { hasError: boolean }) {
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 py-2 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
          className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-red-400 to-red-600 shadow-[var(--shadow-md)]"
        >
          <XCircle size={30} strokeWidth={2.5} className="text-white" />
        </motion.div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Не получилось</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Ссылка истекла или некорректна. Зарегистрируйся заново.
          </p>
        </div>
        <Link
          href="/sign-up"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] px-5 text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
        >
          К регистрации
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-5 py-2 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
        className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-tasks-from)] to-[var(--color-tasks-to)] shadow-[var(--shadow-md)]"
      >
        <CheckCircle2 size={30} strokeWidth={2.5} className="text-white" />
      </motion.div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Email подтверждён</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Аккаунт готов к работе.</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] px-5 text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
      >
        Перейти в LETget →
      </Link>
    </motion.div>
  );
}
