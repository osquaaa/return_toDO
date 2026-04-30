'use client';

import { Check, Flame, Minus, MoreVertical, Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

import {
  archiveHabitAction,
  checkinAction,
  decrementCheckinAction,
  removeCheckinAction,
} from './actions';
import { EditHabitDialog } from './edit-habit-dialog';
import { HeatmapStrip } from './heatmap-strip';
import { resolveColor } from './palette';
import type { HabitDTO, HabitFrequency } from './types';

type Props = {
  habit: HabitDTO;
  performedOn: string;
  count: number;
  streak: number;
  isToday: boolean;
  cells: { date: string; count: number }[];
};

export function HabitRow({ habit, performedOn, count, streak, isToday, cells }: Props) {
  const [pending, startTransition] = useTransition();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [editing, setEditing] = useState(false);

  const accent = resolveColor(habit.color);
  const target = habit.targetCount;
  const done = count >= target;
  const progress = Math.min(1, target > 0 ? count / target : 0);

  const onIncrement = () => {
    startTransition(async () => {
      const r = await checkinAction({
        habitId: habit.id,
        performedOn,
        count: 1,
      });
      if (!r.ok) toast.error(r.error);
    });
  };

  const onDecrement = () => {
    startTransition(async () => {
      const r = await decrementCheckinAction(habit.id, performedOn);
      if (!r.ok) toast.error(r.error);
    });
  };

  const onToggle = () => {
    startTransition(async () => {
      if (done) {
        const r = await removeCheckinAction(habit.id, performedOn);
        if (!r.ok) toast.error(r.error);
      } else {
        const r = await checkinAction({ habitId: habit.id, performedOn, count: 1 });
        if (!r.ok) toast.error(r.error);
      }
    });
  };

  const initial = (habit.icon && habit.icon.trim()) || habit.name.charAt(0).toUpperCase();

  return (
    <li
      className={cn(
        'group relative flex flex-col gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3 transition-colors',
        'hover:border-[var(--color-border-default)]',
        done && 'opacity-90',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-base font-semibold tracking-tight"
          style={{
            background: `color-mix(in srgb, ${accent} 16%, var(--color-bg-subtle))`,
            color: accent,
          }}
        >
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold tracking-tight text-[var(--color-fg-primary)]">
              {habit.name}
            </span>
            {streak > 1 && (
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: 'var(--color-accent-shopping-soft)',
                  color: 'var(--color-accent-shopping)',
                }}
                title={`Стрик ${streak}`}
              >
                <Flame size={10} strokeWidth={2.6} />
                {streak}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--color-fg-tertiary)]">
            {frequencyLabel(habit.frequency, habit.targetCount)}
            {target > 1 && (
              <>
                {' · '}
                <span style={{ color: done ? accent : undefined }}>
                  {count}/{target}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {target === 1 ? (
            <button
              type="button"
              onClick={onToggle}
              disabled={pending || !isToday}
              aria-label={done ? 'Снять отметку' : 'Отметить выполненным'}
              className={cn(
                'group/done flex size-9 items-center justify-center rounded-full border-2 transition-all',
                'disabled:opacity-50',
                done
                  ? 'shadow-[var(--shadow-xs)]'
                  : isToday
                    ? 'border-[var(--color-border-strong)] bg-[var(--color-bg-app)] hover:scale-110'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-bg-app)]',
              )}
              style={
                done ? { background: accent, borderColor: accent } : isToday ? undefined : undefined
              }
            >
              <Check
                size={16}
                strokeWidth={3.5}
                className={cn(
                  'transition-all',
                  done ? 'scale-100 text-white opacity-100' : 'scale-50 opacity-0',
                )}
              />
            </button>
          ) : (
            <Counter
              count={count}
              target={target}
              accent={accent}
              done={done}
              isToday={isToday}
              pending={pending}
              onPlus={onIncrement}
              onMinus={onDecrement}
            />
          )}
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            aria-label="Действия"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {target > 1 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.round(progress * 100)}%`, background: accent }}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <HeatmapStrip color={accent} cells={cells} />
        <span className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          14 дней
        </span>
      </div>

      <Dialog open={actionsOpen} onClose={() => setActionsOpen(false)}>
        <div className="-m-1 flex flex-col">
          <button
            type="button"
            onClick={() => {
              setActionsOpen(false);
              setEditing(true);
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--color-fg-primary)] transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)]">
              <Check size={16} />
            </span>
            Редактировать
          </button>
          <button
            type="button"
            onClick={() => {
              setActionsOpen(false);
              setConfirmArchive(true);
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-subtle)]">
              <Minus size={16} />
            </span>
            Архивировать
          </button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Архивировать привычку?"
        description="Привычка скроется из списка. Все отметки сохранятся."
        confirmLabel="Архивировать"
        variant="danger"
        loading={archiving}
        onConfirm={async () => {
          setArchiving(true);
          const r = await archiveHabitAction(habit.id);
          setArchiving(false);
          setConfirmArchive(false);
          if (r.ok) toast.success('Привычка в архиве');
          else toast.error(r.error);
        }}
      />

      <EditHabitDialog open={editing} onClose={() => setEditing(false)} habit={habit} />
    </li>
  );
}

function Counter({
  count,
  target,
  accent,
  done,
  isToday,
  pending,
  onPlus,
  onMinus,
}: {
  count: number;
  target: number;
  accent: string;
  done: boolean;
  isToday: boolean;
  pending: boolean;
  onPlus: () => void;
  onMinus: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border px-1 py-0.5"
      style={{
        borderColor: done ? accent : 'var(--color-border-default)',
        background: done ? `color-mix(in srgb, ${accent} 16%, transparent)` : undefined,
      }}
    >
      <button
        type="button"
        onClick={onMinus}
        disabled={pending || count === 0 || !isToday}
        aria-label="Минус"
        className="flex size-7 items-center justify-center rounded-full text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span
        className="min-w-[36px] text-center text-xs font-semibold tabular-nums"
        style={{ color: done ? accent : 'var(--color-fg-primary)' }}
      >
        {count}/{target}
      </span>
      <button
        type="button"
        onClick={onPlus}
        disabled={pending || !isToday}
        aria-label="Плюс"
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
        style={{ color: accent }}
      >
        <Plus size={14} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function frequencyLabel(f: HabitFrequency, n: number): string {
  switch (f) {
    case 'daily':
      return n > 1 ? `Каждый день · ${n} раз` : 'Каждый день';
    case 'weekly':
      return 'Раз в неделю';
    case 'n_per_week':
      return `${n} ${plural(n, 'раз', 'раза', 'раз')} в неделю`;
    default:
      return '';
  }
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
