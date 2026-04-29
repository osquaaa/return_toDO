'use client';

import { useState } from 'react';

import { TaskEditor } from './task-editor';
import { deleteTaskAction, toggleDoneAction, togglePinAction, updateTaskAction } from './actions';

export type TaskRow = {
  id: string;
  contentHtml: string;
  contentText: string;
  isDone: boolean;
  isPinned: boolean;
  deadline: string | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  deletedAt: string | null;
};

function fmtDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskItem({
  task,
  selected,
  onToggleSelect,
}: {
  task: TaskRow;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <TaskEditor
          initialHtml={task.contentHtml}
          initialDeadline={task.deadline}
          initialPinned={task.isPinned}
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await updateTaskAction(task.id, data);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  const deadlineFmt = fmtDeadline(task.deadline);
  const overdue = !!task.deadline && !task.isDone && new Date(task.deadline) < new Date();

  // contentHtml is sanitized server-side via DOMPurify in lib/sanitize.ts before storage,
  // so rendering here is safe.
  return (
    <li
      className={`group flex items-start gap-3 rounded-2xl bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] ${
        task.isPinned ? 'border-l-4 border-[var(--color-tasks-from)]' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 size-4 cursor-pointer"
        aria-label="Выбрать"
      />
      <button
        type="button"
        onClick={() => void toggleDoneAction(task.id)}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
          task.isDone
            ? 'border-[var(--color-tasks-to)] bg-[var(--color-tasks-to)] text-white'
            : 'border-[var(--color-border)]'
        }`}
        aria-label="Отметить выполненным"
      >
        {task.isDone ? '✓' : ''}
      </button>
      <div
        onClick={() => setEditing(true)}
        className={`flex-1 cursor-text ${task.isDone ? 'opacity-60 line-through' : ''}`}
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: task.contentHtml }}
        />
        {deadlineFmt && (
          <div
            className={`mt-1 text-xs ${overdue ? 'text-red-600' : 'text-[var(--color-ink-soft)]'}`}
          >
            ⏰ {deadlineFmt}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => void togglePinAction(task.id)}
          className="text-sm hover:text-[var(--color-ink)]"
          title={task.isPinned ? 'Открепить' : 'Закрепить'}
        >
          {task.isPinned ? '📍' : '📌'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Удалить задачу?')) void deleteTaskAction(task.id);
          }}
          className="text-sm hover:text-red-600"
          title="Удалить"
        >
          🗑
        </button>
      </div>
    </li>
  );
}
