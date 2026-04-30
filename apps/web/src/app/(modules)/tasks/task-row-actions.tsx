'use client';

import { Calendar, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog, Dialog } from '@/components/ui/dialog';

import { deleteTaskAction, togglePinAction, updateTaskAction } from './actions';

type Props = {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPinned: boolean;
  deadline: string | null;
  onEditRich: () => void;
};

export function TaskRowActions({ open, onClose, taskId, isPinned, deadline, onEditRich }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeadlineEdit, setShowDeadlineEdit] = useState(false);
  const [draftDeadline, setDraftDeadline] = useState<string>(deadline ? deadline.slice(0, 16) : '');
  const [savingDl, setSavingDl] = useState(false);
  const dlInputRef = useRef<HTMLInputElement | null>(null);

  const openDeadlineEdit = () => {
    setDraftDeadline(deadline ? deadline.slice(0, 16) : '');
    setShowDeadlineEdit(true);
  };

  useEffect(() => {
    if (showDeadlineEdit) {
      const t = window.setTimeout(() => dlInputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [showDeadlineEdit]);

  const items = [
    {
      icon: <Pencil size={16} />,
      label: 'Редактировать',
      onClick: () => {
        onClose();
        onEditRich();
      },
    },
    {
      icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      label: isPinned ? 'Открепить' : 'Закрепить',
      onClick: async () => {
        onClose();
        const r = await togglePinAction(taskId);
        if (!r.ok) toast.error(r.error);
      },
    },
    {
      icon: <Calendar size={16} />,
      label: deadline ? 'Изменить дедлайн' : 'Добавить дедлайн',
      onClick: () => openDeadlineEdit(),
    },
    {
      icon: <Trash2 size={16} />,
      label: 'Удалить',
      danger: true,
      onClick: () => setConfirmDelete(true),
    },
  ];

  return (
    <>
      <Dialog open={open && !confirmDelete && !showDeadlineEdit} onClose={onClose}>
        <div className="-m-1 flex flex-col">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={it.onClick}
              className={
                'flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-[var(--color-bg-hover)] ' +
                (it.danger
                  ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
                  : 'text-[var(--color-fg-primary)]')
              }
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)]">
                {it.icon}
              </span>
              {it.label}
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={showDeadlineEdit}
        onClose={() => {
          setShowDeadlineEdit(false);
          onClose();
        }}
        title={deadline ? 'Изменить дедлайн' : 'Добавить дедлайн'}
      >
        <div className="space-y-4">
          <input
            ref={dlInputRef}
            type="datetime-local"
            value={draftDeadline}
            onChange={(e) => setDraftDeadline(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
          />
          <div className="flex items-center justify-between gap-2">
            {deadline ? (
              <button
                type="button"
                onClick={async () => {
                  setSavingDl(true);
                  const r = await updateTaskAction(taskId, { deadline: null });
                  setSavingDl(false);
                  if (r.ok) {
                    toast.success('Дедлайн снят');
                    setShowDeadlineEdit(false);
                    onClose();
                  } else toast.error(r.error);
                }}
                disabled={savingDl}
                className="text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
              >
                Убрать
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeadlineEdit(false);
                  onClose();
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-fg-secondary)] hover:bg-[var(--color-bg-hover)]"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={savingDl || !draftDeadline}
                onClick={async () => {
                  setSavingDl(true);
                  const iso = new Date(draftDeadline).toISOString();
                  const r = await updateTaskAction(taskId, { deadline: iso });
                  setSavingDl(false);
                  if (r.ok) {
                    toast.success('Дедлайн обновлён');
                    setShowDeadlineEdit(false);
                    onClose();
                  } else toast.error(r.error);
                }}
                className="rounded-lg bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-fg)] disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </Dialog>

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
          const r = await deleteTaskAction(taskId);
          setDeleting(false);
          setConfirmDelete(false);
          onClose();
          if (r.ok) toast.success('Задача удалена');
          else toast.error(r.error);
        }}
      />
    </>
  );
}
