import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { userPreferences } from '@letget/db/schema';

import { requireUser } from '@/lib/auth/session';
import { ThemeSwitcher } from '@/components/pwa/theme-switcher';
import type { Theme } from '@/lib/theme';

import { TelegramCard } from './telegram-card';

export const metadata = { title: 'Настройки — LETget' };

const { db } = createDbClient();

export default async function SettingsPage() {
  const user = await requireUser();
  const prefs = await db
    .select({ theme: userPreferences.theme })
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);
  const initialTheme = (prefs[0]?.theme ?? 'system') as Theme;
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
      <section className="rounded-3xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
        <h2 className="text-lg font-medium">Тема</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Выбери оформление. «Авто» подстроится под систему.
        </p>
        <div className="mt-4">
          <ThemeSwitcher initial={initialTheme} />
        </div>
      </section>
      <TelegramCard />
    </div>
  );
}
