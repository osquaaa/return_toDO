'use client';

import { motion } from 'framer-motion';
import { MailCheck, Sparkles } from 'lucide-react';

export function VerifySentView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-6 py-2 text-center"
    >
      <div className="mb-4 flex items-center gap-2.5 self-start lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Sparkles size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">LETget</span>
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
        className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-md)]"
      >
        <MailCheck size={36} strokeWidth={2.2} className="text-white" />
      </motion.div>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Почти готово
        </h2>
        <p className="text-sm text-[var(--color-fg-secondary)]">
          Отправили письмо для подтверждения email. Проверь входящие и спам.
          <br />
          Ссылка действует 24 часа.
        </p>
      </div>
      <p className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4 py-3 text-xs text-[var(--color-fg-secondary)]">
        Не пришло? Проверь, что email введён правильно — можно зарегистрироваться ещё раз.
      </p>
    </motion.div>
  );
}
