'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import { addExerciseAction } from './actions';

const ICON_SUGGESTIONS = ['💪', '🤸', '👊', '🏋️', '🦵', '🧗', '🏃', '🚴'];

export function AddExerciseModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await addExerciseAction({ name: trimmed, icon: icon || null });
      if (r.ok) {
        onClose();
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <Dialog open onClose={onClose} title="Новое упражнение">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Название
          </label>
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="Например, Приседания"
            maxLength={100}
            inputSize="md"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--color-fg-secondary)] uppercase">
            Иконка (опц.)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_SUGGESTIONS.map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => setIcon(icon === emo ? '' : emo)}
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border text-base transition-colors',
                  icon === emo
                    ? 'border-[var(--color-accent-workouts)] bg-[var(--color-accent-workouts-soft)]'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-hover)]',
                )}
              >
                {emo}
              </button>
            ))}
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 4))}
              placeholder="—"
              className="size-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-center text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-accent-workouts)]"
            />
          </div>
        </div>

        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="md" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isPending}
            disabled={!name.trim()}
            onClick={submit}
          >
            Добавить
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
