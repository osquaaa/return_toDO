'use client';

import { Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { createTaskAction } from './actions';
import { TaskBulkBar } from './task-bulk-bar';
import { TaskEditor } from './task-editor';
import { TaskItem, type TaskRow } from './task-item';

export function TaskList({ items }: { items: TaskRow[] }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {creating ? (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
          <TaskEditor
            submitLabel="Создать"
            onCancel={() => setCreating(false)}
            onSubmit={async (data) => {
              await createTaskAction(data);
              setCreating(false);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]/50 px-4 py-3 text-left text-sm transition-all hover:border-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-elevated)]"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)]">
            <Plus size={14} strokeWidth={2.6} />
          </span>
          <span className="text-[var(--color-fg-secondary)] group-hover:text-[var(--color-fg-primary)]">
            Новая задача…
          </span>
          <kbd className="ml-auto hidden h-5 items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-1.5 text-[10px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase sm:inline-flex">
            N
          </kbd>
        </button>
      )}

      <ul className="space-y-1.5">
        {items.length === 0 ? (
          <li className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-tasks)]/15 to-[var(--color-accent-tasks)]/5">
              <Sparkles size={28} strokeWidth={2} className="text-[var(--color-accent-tasks)]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
                Чистый лист
              </h3>
              <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
                Запиши, что хочется не забыть. Можно с дедлайном — придёт пуш в Telegram.
              </p>
            </div>
            <Button
              onClick={() => setCreating(true)}
              variant="primary"
              size="md"
              iconLeft={<Plus size={14} />}
            >
              Создать первую
            </Button>
          </li>
        ) : (
          items.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              selected={selected.has(t.id)}
              onToggleSelect={() => toggle(t.id)}
            />
          ))
        )}
      </ul>

      <TaskBulkBar selected={selected} onClear={() => setSelected(new Set())} />
    </div>
  );
}
