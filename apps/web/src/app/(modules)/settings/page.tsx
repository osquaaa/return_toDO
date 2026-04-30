import { eq } from 'drizzle-orm';
import { Palette, User } from 'lucide-react';

import { createDbClient } from '@letget/db/client';
import { userPreferences } from '@letget/db/schema';

import { ThemeSwitcher } from '@/components/pwa/theme-switcher';
import { requireUser } from '@/lib/auth/session';
import type { Theme } from '@/lib/theme';

import { SettingsFade } from './settings-fade';
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
    <SettingsFade>
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Настройки</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Профиль, тема и подключения.</p>
        </header>

        <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-canvas)]">
              <User size={16} strokeWidth={2.2} className="text-[var(--color-ink-soft)]" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">Профиль</h2>
          </header>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
            <dt className="text-[var(--color-ink-soft)]">Имя</dt>
            <dd className="font-medium">{user.name ?? '—'}</dd>
            <dt className="text-[var(--color-ink-soft)]">Email</dt>
            <dd className="font-medium">{user.email}</dd>
            <dt className="text-[var(--color-ink-soft)]">Роль</dt>
            <dd>
              <span className="inline-flex items-center rounded-md bg-[var(--color-canvas)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
                {user.role}
              </span>
            </dd>
          </dl>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--color-canvas)]">
              <Palette size={16} strokeWidth={2.2} className="text-[var(--color-ink-soft)]" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">Тема</h2>
          </header>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Выбери оформление. «Авто» подстроится под систему.
          </p>
          <div className="mt-4">
            <ThemeSwitcher initial={initialTheme} />
          </div>
        </section>

        <TelegramCard />
      </div>
    </SettingsFade>
  );
}
