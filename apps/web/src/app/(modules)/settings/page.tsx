import { eq } from 'drizzle-orm';
import { LogOut, Mail, Palette, Send, Shield, User } from 'lucide-react';

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
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <header className="space-y-1">
          <div className="text-xs font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            Аккаунт
          </div>
          <h1 className="text-balance text-[40px] leading-[1.05] font-semibold tracking-tight md:text-[48px]">
            Настройки
          </h1>
          <p className="pt-1 text-base text-[var(--color-fg-secondary)]">
            Профиль, тема, подключения и привязки.
          </p>
        </header>

        {/* Profile card */}
        <section className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
          <div className="flex items-center gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 px-6 py-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-lg font-semibold tracking-tight text-[var(--color-brand-fg)] shadow-[var(--shadow-sm)]">
              {(user.name ?? user.email)
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
                {user.name ?? user.email}
              </div>
              <div className="truncate text-sm text-[var(--color-fg-secondary)]">{user.email}</div>
            </div>
            {user.role === 'admin' && (
              <span className="hidden items-center gap-1 rounded-full bg-[var(--color-brand-from)]/10 px-2.5 py-1 text-xs font-semibold tracking-tight text-[var(--color-brand-from)] sm:inline-flex">
                <Shield size={12} strokeWidth={2.5} />
                Админ
              </span>
            )}
          </div>
          <dl className="grid grid-cols-1 divide-y divide-[var(--color-border-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Field icon={<User size={14} />} label="Имя" value={user.name ?? '—'} />
            <Field icon={<Mail size={14} />} label="Email" value={user.email} />
            <Field icon={<Shield size={14} />} label="Роль" value={user.role} />
          </dl>
        </section>

        {/* Theme card */}
        <SettingsSection
          icon={<Palette size={16} />}
          title="Тема"
          subtitle="Авто подстроится под систему."
        >
          <ThemeSwitcher initial={initialTheme} />
        </SettingsSection>

        {/* Telegram card — already styled inside */}
        <SettingsSection
          icon={<Send size={16} />}
          title="Telegram"
          subtitle="Push-уведомления и быстрые команды через бота."
        >
          <TelegramCard />
        </SettingsSection>

        {/* Sign out */}
        <section className="flex items-center justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-5 py-4">
          <div>
            <div className="text-sm font-medium text-[var(--color-fg-primary)]">
              Выйти из аккаунта
            </div>
            <div className="text-xs text-[var(--color-fg-secondary)]">
              Сессия будет завершена на этом устройстве.
            </div>
          </div>
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm font-medium text-[var(--color-fg-primary)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </form>
        </section>
      </div>
    </SettingsFade>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 truncate text-sm font-medium text-[var(--color-fg-primary)]">
        {value}
      </div>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 md:p-6">
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--color-fg-secondary)]">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
