'use client';

import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';

export function VerifySentView() {
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
        <MailCheck size={30} strokeWidth={2.5} className="text-white" />
      </motion.div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Почти готово</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Мы отправили письмо для подтверждения email. Проверь входящие и спам.
          <br />
          Ссылка действует 24 часа.
        </p>
      </div>
      <p className="rounded-xl bg-[var(--color-canvas)] px-3 py-2 text-xs text-[var(--color-ink-faint)]">
        Не пришло? Проверь, что email введён правильно — можно зарегистрироваться ещё раз.
      </p>
    </motion.div>
  );
}
