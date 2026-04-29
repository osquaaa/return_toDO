import { requireUser } from '@/lib/auth/session';

import { TelegramCard } from './telegram-card';

export const metadata = { title: 'Настройки — LETget' };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
      <section className="rounded-3xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
        <h2 className="text-lg font-medium">Профиль</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-[var(--color-ink-soft)]">Имя</dt>
          <dd>{user.name ?? '—'}</dd>
          <dt className="text-[var(--color-ink-soft)]">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-[var(--color-ink-soft)]">Роль</dt>
          <dd>{user.role}</dd>
        </dl>
      </section>
      <TelegramCard />
    </div>
  );
}
