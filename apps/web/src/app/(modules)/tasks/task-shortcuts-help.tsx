'use client';

import { Dialog } from '@/components/ui/dialog';

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['N', '/'], label: 'Поставить курсор в строку быстрого добавления' },
  { keys: ['Enter'], label: 'Сохранить задачу' },
  { keys: ['Shift', 'Enter'], label: 'Новая строка в задаче' },
  { keys: ['⌘/Ctrl', 'Enter'], label: 'Открыть расширенный редактор' },
  { keys: ['Esc'], label: 'Отменить ввод / закрыть' },
  { keys: ['?'], label: 'Показать эту подсказку' },
];

type Props = { open: boolean; onClose: () => void };

export function TaskShortcutsHelp({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Горячие клавиши">
      <ul className="-mx-1 flex flex-col">
        {SHORTCUTS.map((s, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm"
          >
            <span className="text-[var(--color-fg-secondary)]">{s.label}</span>
            <span className="flex shrink-0 items-center gap-1">
              {s.keys.map((k, j) => (
                <span key={j} className="flex items-center gap-1">
                  <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-1.5 text-[11px] font-medium tracking-tight text-[var(--color-fg-primary)]">
                    {k}
                  </kbd>
                  {j < s.keys.length - 1 && (
                    <span className="text-[10px] text-[var(--color-fg-tertiary)]">+</span>
                  )}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
