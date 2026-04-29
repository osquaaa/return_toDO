'use client';

import { useState, useTransition } from 'react';

import { requestReset } from './actions';

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)]';

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-center text-sm text-[var(--color-ink-soft)]">
        Если такой email есть в системе, мы отправили инструкцию для сброса.
      </p>
    );
  }
  return (
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
      <h2 className="text-center text-xl font-semibold tracking-tight">Сброс пароля</h2>
      <label className="block">
        <span className="text-sm">Email</span>
        <input type="email" name="email" required className={inputCls} />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-[var(--color-canvas)] disabled:opacity-50"
      >
        {isPending ? 'Отправляем…' : 'Прислать ссылку'}
      </button>
    </form>
  );
}
