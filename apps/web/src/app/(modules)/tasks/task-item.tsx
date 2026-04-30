'use client';

import { Check, Clock, Pin, PinOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

import { deleteTaskAction, toggleDoneAction, togglePinAction, updateTaskAction } from './actions';
import { TaskEditor } from './task-editor';

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

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTH_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

function fmtDeadline(iso: string | null): { label: string; relative: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  let relative: string;
  if (d < now) {
    const minsAgo = Math.round((now.getTime() - d.getTime()) / 60_000);
    if (minsAgo < 60) relative = `${minsAgo} мин назад`;
    else if (minsAgo < 60 * 24) relative = `${Math.round(minsAgo / 60)} ч назад`;
    else relative = `${Math.round(minsAgo / 60 / 24)} дн назад`;
  } else if (d < startOfTomorrow) relative = 'сегодня';
  else if (d < startOfDayAfter) relative = 'завтра';
  else relative = `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;

  return { label: time, relative };
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <li className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
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

  const deadline = fmtDeadline(task.deadline);
  const overdue = !!task.deadline && !task.isDone && new Date(task.deadline) < new Date();

  return (
    <li
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3 transition-colors hover:border-[var(--color-border-default)]',
        task.isPinned && 'border-l-[3px] border-l-[var(--color-accent-tasks)]',
        task.isDone && 'opacity-60',
      )}
    >
      {/* Bulk select checkbox — visible on hover or when selected */}
      <div
        className={cn(
          'flex h-5 shrink-0 items-center transition-opacity',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <Checkbox
          size="sm"
          accent="brand"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label="Выбрать"
        />
      </div>

      {/* Big done circle */}
      <button
        type="button"
        onClick={() => void toggleDoneAction(task.id)}
        className={cn(
          'mt-px flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          task.isDone
            ? 'border-[var(--color-accent-tasks)] bg-[var(--color-accent-tasks)]'
            : 'border-[var(--color-border-strong)] bg-transparent hover:border-[var(--color-accent-tasks)]',
        )}
        aria-label={task.isDone ? 'Снять отметку' : 'Отметить выполненным'}
      >
        <Check
          size={12}
          strokeWidth={3.5}
          className={cn(
            'text-white transition-all',
            task.isDone ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        />
      </button>

      {/* Body */}
      <div
        onClick={() => setEditing(true)}
        className={cn('min-w-0 flex-1 cursor-text', task.isDone && 'line-through')}
      >
        <div
          className="prose prose-sm max-w-none break-words text-[var(--color-fg-primary)] [&_a]:text-[var(--color-accent-code)] [&_a]:underline [&_p]:my-0 [&_ul]:my-0.5 [&_ol]:my-0.5"
          // contentHtml is DOMPurify-sanitized in lib/sanitize.ts before storage.
          dangerouslySetInnerHTML={{ __html: task.contentHtml }}
        />
        {deadline && (
          <div
            className={cn(
              'mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
              overdue
                ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]',
            )}
          >
            <Clock size={11} strokeWidth={2.5} />
            <span>
              {deadline.relative} · {deadline.label}
            </span>
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => void togglePinAction(task.id)}
          className="flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
          aria-label={task.isPinned ? 'Открепить' : 'Закрепить'}
        >
          {task.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          aria-label="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить задачу?"
        description="Задача будет помещена в корзину. Восстановить её можно позже."
        confirmLabel="Удалить"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const r = await deleteTaskAction(task.id);
          setDeleting(false);
          setConfirmDelete(false);
          if (r.ok) toast.success('Задача удалена');
          else toast.error(r.error);
        }}
      />
    </li>
  );
}
