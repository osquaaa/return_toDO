'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

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
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)]"
      >
        <h3 className="text-base font-semibold">Новое упражнение</h3>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="Например, Приседания"
            maxLength={100}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2.5 text-sm focus:border-[var(--color-workout-to)] focus:outline-none"
          />

          <div>
            <div className="mb-1.5 text-xs text-[var(--color-ink-soft)]">Иконка (опц.)</div>
            <div className="flex flex-wrap gap-1.5">
              {ICON_SUGGESTIONS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setIcon(icon === emo ? '' : emo)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-base ${
                    icon === emo
                      ? 'ring-2 ring-[var(--color-workout-to)]'
                      : 'bg-[var(--color-panel)] hover:bg-[var(--color-canvas)]'
                  }`}
                >
                  {emo}
                </button>
              ))}
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                placeholder="—"
                className="h-9 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-center text-sm focus:border-[var(--color-workout-to)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim()}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-50"
            style={{
              background:
                'linear-gradient(135deg, var(--color-workout-from), var(--color-workout-to))',
            }}
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
