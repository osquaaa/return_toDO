'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MailCheck, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { requestReset } from './actions';

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 py-2 text-center"
      >
        <div className="mb-10 flex items-center gap-2.5 self-start lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
            <Mail size={16} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">LETget</span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
          className="flex size-16 items-center justify-center rounded-3xl bg-[var(--color-success-soft)]"
        >
          <MailCheck size={30} strokeWidth={2.4} className="text-[var(--color-success)]" />
        </motion.div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
            Проверь почту
          </h2>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Если такой email есть в системе, мы отправили инструкцию для сброса. Ссылка
            действительна 1 час.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-[var(--color-fg-primary)] hover:underline"
        >
          Назад ко входу
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
          <Mail size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">LETget</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Сброс пароля
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
          Пришлём ссылку на email — открой её, чтобы задать новый пароль.
        </p>
      </div>

      <form
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          iconRight={!isPending ? <ArrowRight size={16} /> : undefined}
        >
          {isPending ? 'Отправляем…' : 'Прислать ссылку'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-fg-secondary)]">
        Вспомнил пароль?{' '}
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
