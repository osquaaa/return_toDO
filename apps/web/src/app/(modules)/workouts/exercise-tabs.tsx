'use client';

export type ExerciseTab = {
  id: string;
  name: string;
  icon: string | null;
};

export function ExerciseTabs({
  items,
  activeId,
  onSelect,
  onAddClick,
}: {
  items: ExerciseTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              active
                ? 'text-white shadow-[var(--shadow-sm)]'
                : 'bg-[var(--color-panel)] text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
            }`}
            style={
              active
                ? {
                    background:
                      'linear-gradient(135deg, var(--color-workout-from), var(--color-workout-to))',
                  }
                : undefined
            }
          >
            {it.icon && <span className="text-base">{it.icon}</span>}
            {it.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddClick}
        title="Добавить упражнение"
        className="ml-1 flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        +
      </button>
    </div>
  );
}
