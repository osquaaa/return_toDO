'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={isPending}
      aria-label="Выйти"
      onClick={() =>
        startTransition(async () => {
          await fetch('/api/auth/sign-out', { method: 'POST' });
          router.push('/sign-in');
          router.refresh();
        })
      }
      className="!size-7 !p-0"
    >
      {!isPending && <LogOut size={14} />}
    </Button>
  );
}
