'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function VerifyEmailView({ hasError }: { hasError: boolean }) {
  if (hasError) {
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
          className="flex size-20 items-center justify-center rounded-3xl bg-[var(--color-danger-soft)]"
        >
          <XCircle size={36} strokeWidth={2.2} className="text-[var(--color-danger)]" />
        </motion.div>
        <div className="space-y-1.5">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
            Не получилось
          </h2>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Ссылка истекла или некорректна. Зарегистрируйся заново — пришлём свежую.
          </p>
        </div>
        <Link href="/sign-up" className="inline-block">
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />}>
            К регистрации
          </Button>
        </Link>
      </motion.div>
    );
  }

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
        className="flex size-20 items-center justify-center rounded-3xl bg-[var(--color-success-soft)]"
      >
        <CheckCircle2 size={36} strokeWidth={2.2} className="text-[var(--color-success)]" />
      </motion.div>
      <div className="space-y-1.5">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Email подтверждён
        </h2>
        <p className="text-sm text-[var(--color-fg-secondary)]">
          Аккаунт готов к работе. Можно начинать.
        </p>
      </div>
      <Link href="/" className="inline-block">
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />}>
          В LETget
        </Button>
      </Link>
    </motion.div>
  );
}
