'use client';

import { useState } from 'react';

import { TaskBulkBar } from './task-bulk-bar';
import { TaskEditor } from './task-editor';
import { TaskItem, type TaskRow } from './task-item';
import { createTaskAction } from './actions';

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
        <div className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
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
          className="w-full rounded-2xl border-2 border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
        >
          + Новая задача
        </button>
      )}

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Пусто. Создайте первую задачу.
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
