import Link from 'next/link';

const navItems = [
  { href: '/tasks', label: 'Задачи', icon: '✓' },
  { href: '/shopping', label: 'Покупки', icon: '🛒' },
  { href: '/code', label: 'Код', icon: '⌨' },
  { href: '/workouts', label: 'Тренировки', icon: '💪' },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[220px] flex-col border-r border-[--color-border] bg-[--color-panel] p-4">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <span
          className="block w-7 h-7 rounded-md"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-from), var(--color-brand-to))',
          }}
        />
        <span className="font-extrabold text-lg">LETget</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[--color-ink-soft] hover:bg-[--color-canvas] hover:text-[--color-ink] transition-colors text-sm font-medium"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-[--color-ink-faint]">
        Лаконично. Понятно. На каждый день.
      </div>
    </aside>
  );
}
