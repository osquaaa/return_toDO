'use client';

import { Check, Clock, MoreVertical, Pin, PinOff, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

import { deleteTaskAction, toggleDoneAction, togglePinAction, updateTaskAction } from './actions';
import { TaskEditor } from './task-editor';
import { TaskRowActions } from './task-row-actions';

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

type Props = {
  task: TaskRow;
  selected: boolean;
  onToggleSelect: () => void;
  selectionMode: boolean;
};

export function TaskItem({ task, selected, onToggleSelect, selectionMode }: Props) {
  const [editingRich, setEditingRich] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [inlineEditing, setInlineEditing] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Sync DOM when content changes from server (after revalidation) and we're not editing.
  useEffect(() => {
    if (!inlineEditing && bodyRef.current) {
      bodyRef.current.innerHTML = task.contentHtml;
    }
  }, [task.contentHtml, inlineEditing]);

  if (editingRich) {
    return (
      <li className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <TaskEditor
          initialHtml={task.contentHtml}
          initialDeadline={task.deadline}
          initialPinned={task.isPinned}
          onCancel={() => setEditingRich(false)}
          onSubmit={async (data) => {
            const r = await updateTaskAction(task.id, data);
            setEditingRich(false);
            if (!r.ok) toast.error(r.error);
          }}
        />
      </li>
    );
  }

  const deadline = fmtDeadline(task.deadline);
  const overdue = !!task.deadline && !task.isDone && new Date(task.deadline) < new Date();

  const commitInlineEdit = async () => {
    setInlineEditing(false);
    if (!bodyRef.current) return;
    const plainText = (bodyRef.current.innerText ?? '').trim();
    if (!plainText) {
      // empty — restore previous content
      bodyRef.current.innerHTML = task.contentHtml;
      toast.error('Текст не может быть пустым');
      return;
    }
    const newHtml = plainTextToHtml(plainText);
    if (newHtml === task.contentHtml.trim()) return;
    const r = await updateTaskAction(task.id, { contentHtml: newHtml });
    if (!r.ok) {
      bodyRef.current.innerHTML = task.contentHtml;
      toast.error(r.error);
    }
  };

  const onRowClick = () => {
    if (!selectionMode) return;
    onToggleSelect();
  };

  return (
    <li
      onClick={onRowClick}
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3 transition-colors',
        !selectionMode && 'hover:border-[var(--color-border-default)]',
        task.isPinned && 'border-l-[3px] border-l-[var(--color-accent-tasks)]',
        task.isDone && 'opacity-60',
        selectionMode && 'cursor-pointer',
        selectionMode && selected && 'ring-2 ring-[var(--color-brand-from)]',
      )}
    >
      {selectionMode ? (
        <div className="mt-px flex h-5 shrink-0 items-center">
          <Checkbox
            size="sm"
            accent="brand"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label="Выбрать"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggleDoneAction(task.id);
          }}
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
      )}

      <div className={cn('min-w-0 flex-1', task.isDone && 'line-through')}>
        <div
          ref={bodyRef}
          contentEditable={inlineEditing}
          suppressContentEditableWarning
          onClick={(e) => {
            if (selectionMode) return;
            e.stopPropagation();
            if (!inlineEditing) setInlineEditing(true);
          }}
          onBlur={() => {
            if (inlineEditing) void commitInlineEdit();
          }}
          onKeyDown={(e) => {
            if (!inlineEditing) return;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget as HTMLDivElement).blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              if (bodyRef.current) bodyRef.current.innerHTML = task.contentHtml;
              setInlineEditing(false);
              (e.currentTarget as HTMLDivElement).blur();
            }
          }}
          className={cn(
            'prose prose-sm max-w-none cursor-text break-words text-[var(--color-fg-primary)] outline-none [&_a]:text-[var(--color-accent-code)] [&_a]:underline [&_ol]:my-0.5 [&_p]:my-0 [&_ul]:my-0.5',
            inlineEditing &&
              'rounded-lg bg-[var(--color-bg-subtle)] px-2 py-1 ring-1 ring-[var(--color-fg-tertiary)]',
          )}
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

      {!selectionMode && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void togglePinAction(task.id);
            }}
            className="hidden size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)] md:flex"
            aria-label={task.isPinned ? 'Открепить' : 'Закрепить'}
          >
            {task.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="hidden size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] md:flex"
            aria-label="Удалить"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActionsOpen(true);
            }}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)] md:size-7"
            aria-label="Действия"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      )}

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

      <TaskRowActions
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        taskId={task.id}
        isPinned={task.isPinned}
        deadline={task.deadline}
        onEditRich={() => setEditingRich(true)}
      />
    </li>
  );
}

function plainTextToHtml(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Split on line breaks, wrap each non-empty line in <p>; keep blanks as <p><br></p>.
  const lines = escaped.split(/\r?\n/);
  return lines.map((l) => `<p>${l.length ? l : '<br>'}</p>`).join('');
}
