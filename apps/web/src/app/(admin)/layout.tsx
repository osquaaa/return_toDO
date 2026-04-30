import {
  Activity,
  ArrowLeft,
  Bell,
  FileSearch,
  Heart,
  LayoutDashboard,
  LogIn,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireAdmin } from '@/lib/auth/session';

import { AdminNavLink } from './admin-nav-link';

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Юзеры', icon: Users },
  { href: '/admin/content', label: 'Контент', icon: FileSearch },
  { href: '/admin/notifications', label: 'Очередь', icon: Bell },
  { href: '/admin/audit', label: 'Audit log', icon: Activity },
  { href: '/admin/logins', label: 'Логины', icon: LogIn },
  { href: '/admin/health', label: 'Здоровье', icon: Heart },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh bg-[var(--color-bg-app)]">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] lg:flex">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
          <div className="relative flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] shadow-[var(--shadow-sm)]">
            <Sparkles size={16} strokeWidth={2.6} className="text-[var(--color-brand-fg)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-base leading-tight font-semibold tracking-tight text-[var(--color-fg-primary)]">
              LETget
              <Shield size={12} strokeWidth={2.6} className="text-[var(--color-brand-from)]" />
            </div>
            <div className="text-[10px] leading-tight tracking-widest text-[var(--color-fg-tertiary)] uppercase">
              Admin · v0.1
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-2">
          <div className="px-3 pb-1.5 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            Навигация
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((n) => (
              <AdminNavLink key={n.href} href={n.href} label={n.label} icon={n.icon} />
            ))}
          </nav>
        </div>

        <div className="m-3">
          <Link
            href="/tasks"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
          >
            <ArrowLeft size={14} />
            На сайт
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-4 py-5 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
