'use client';

import { Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import { createHabitAction, updateHabitAction } from './actions';
import { HABIT_COLORS, resolveColor } from './palette';
import type { HabitDTO, HabitFrequency } from './types';

const ICON_PRESETS = ['🏃', '💧', '📖', '🧘', '💪', '🥗', '🛌', '✍️', '🎯', '☀️', '🚭', '🎵'];

type Mode = 'create' | 'edit';

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: Mode;
  habit?: HabitDTO;
};

export function AddHabitModal(props: Props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.mode === 'edit' ? 'Редактировать привычку' : 'Новая привычка'}
    >
      {props.open && (
        <HabitForm
          key={props.habit?.id ?? 'new'}
          onClose={props.onClose}
          mode={props.mode ?? 'create'}
          habit={props.habit}
        />
      )}
    </Dialog>
  );
}

function HabitForm({
  onClose,
  mode,
  habit,
}: {
  onClose: () => void;
  mode: Mode;
  habit?: HabitDTO;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState<string>(habit?.icon ?? '');
  const [color, setColor] = useState<string>(habit?.color ?? 'sky');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily');
  const [targetCount, setTargetCount] = useState<number>(habit?.targetCount ?? 1);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Название не может быть пустым');
      return;
    }
    const payload = {
      name: trimmed,
      icon: icon.trim() || null,
      color: color || null,
      frequency,
      targetCount: frequency === 'n_per_week' ? targetCount : 1,
    };
    startTransition(async () => {
      const r =
        mode === 'edit' && habit
          ? await updateHabitAction(habit.id, payload)
          : await createHabitAction(payload);
      if (r.ok) {
        toast.success(mode === 'edit' ? 'Привычка обновлена' : 'Привычка добавлена');
        onClose();
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
          Название
        </label>
        <Input
          iconLeft={<Sparkles size={14} strokeWidth={2.4} />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, читать 30 минут"
          autoFocus
          maxLength={100}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
          Иконка
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={cn(
                'flex size-9 items-center justify-center rounded-xl border text-lg transition-all',
                icon === emoji
                  ? 'scale-105 border-[var(--color-fg-primary)] bg-[var(--color-bg-subtle)]'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]',
              )}
              aria-label={`Иконка ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={icon}
          maxLength={4}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="или свой символ"
          className="mt-1.5 h-9 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
          Цвет
        </label>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => {
            const active = color === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={cn(
                  'size-8 rounded-full border-2 transition-all',
                  active ? 'scale-110' : 'border-transparent hover:scale-105',
                )}
                style={{
                  background: c.hex,
                  borderColor: active ? 'var(--color-fg-primary)' : 'transparent',
                  boxShadow: active ? `0 0 0 2px ${c.hex}33` : undefined,
                }}
                aria-label={`Цвет ${c.key}`}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
          Частота
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <FreqPill
            active={frequency === 'daily'}
            onClick={() => setFrequency('daily')}
            accent={resolveColor(color)}
          >
            Каждый день
          </FreqPill>
          <FreqPill
            active={frequency === 'weekly'}
            onClick={() => setFrequency('weekly')}
            accent={resolveColor(color)}
          >
            Раз в неделю
          </FreqPill>
          <FreqPill
            active={frequency === 'n_per_week'}
            onClick={() => setFrequency('n_per_week')}
            accent={resolveColor(color)}
          >
            N раз
          </FreqPill>
        </div>
      </div>

      {frequency === 'n_per_week' && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
            Сколько раз в неделю
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={7}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="flex-1 accent-[var(--color-accent-habits)]"
            />
            <span
              className="flex size-9 items-center justify-center rounded-lg text-sm font-semibold tabular-nums"
              style={{
                background: `color-mix(in srgb, ${resolveColor(color)} 16%, var(--color-bg-subtle))`,
                color: resolveColor(color),
              }}
            >
              {targetCount}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="md" onClick={onClose} disabled={pending}>
          Отмена
        </Button>
        <Button variant="primary" size="md" onClick={submit} loading={pending}>
          {mode === 'edit' ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

function FreqPill({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 items-center justify-center rounded-xl border px-2 text-xs font-medium transition-all',
        active ? 'shadow-[var(--shadow-xs)]' : 'hover:bg-[var(--color-bg-hover)]',
      )}
      style={
        active
          ? {
              borderColor: accent,
              color: accent,
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            }
          : {
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-fg-secondary)',
            }
      }
    >
      {children}
    </button>
  );
}
