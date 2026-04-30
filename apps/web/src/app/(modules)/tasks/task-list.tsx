'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Plus } from 'lucide-react';
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
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
        >
          <TaskEditor
            submitLabel="Создать"
            onCancel={() => setCreating(false)}
            onSubmit={async (data) => {
              await createTaskAction(data);
              setCreating(false);
            }}
          />
        </motion.div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          <Plus size={16} strokeWidth={2.4} />
          Новая задача
        </button>
      )}

      <ul className="space-y-2">
        {items.length === 0 ? (
          <motion.li
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-6 py-12 text-center shadow-[var(--shadow-sm)]"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-tasks-from)]/15 to-[var(--color-tasks-to)]/15">
              <CheckCircle2 size={24} strokeWidth={2} className="text-[var(--color-tasks-to)]" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
                Пусто
              </h3>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                Создайте первую задачу — и сразу почувствуете лёгкость.
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] px-4 text-sm font-semibold text-[var(--color-canvas)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
            >
              <Plus size={14} strokeWidth={2.5} />
              Создать задачу
            </button>
          </motion.li>
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
