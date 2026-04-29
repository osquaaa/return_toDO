'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await fetch('/api/auth/sign-out', { method: 'POST' });
          router.push('/sign-in');
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50"
    >
      Выйти
    </button>
  );
}
