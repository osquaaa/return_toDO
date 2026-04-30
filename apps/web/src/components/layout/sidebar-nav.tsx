import Link from 'next/link';

const navItems = [
  { href: '/tasks', label: 'Задачи', icon: '✓' },
  { href: '/shopping', label: 'Покупки', icon: '🛒' },
  { href: '/code', label: 'Код', icon: '⌨' },
  { href: '/workouts', label: 'Тренировки', icon: '💪' },
  { href: '/settings', label: 'Настройки', icon: '⚙' },
];

export function SidebarNav() {
  return (
    <>
      <Link href="/" className="mb-6 flex items-center gap-2">
        <span
          className="block h-7 w-7 rounded-md"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-from), var(--color-brand-to))',
          }}
        />
        <span className="text-lg font-extrabold">LETget</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-[var(--color-ink-faint)]">
        Лаконично. Понятно. На каждый день.
      </div>
    </>
  );
}
