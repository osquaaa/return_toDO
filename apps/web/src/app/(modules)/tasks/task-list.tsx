'use client';

import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

import { createTaskAction } from './actions';
import { QuickAddBar } from './quick-add-bar';
import { TaskBulkBar } from './task-bulk-bar';
import { TaskEditor } from './task-editor';
import { TaskFilters } from './task-filters';
import { TaskItem, type TaskRow } from './task-item';
import { TaskShortcutsHelp } from './task-shortcuts-help';

type GroupKey = 'overdue' | 'pinned' | 'today' | 'tomorrow' | 'later' | 'done';

type Group = {
  key: GroupKey;
  label: string;
  items: TaskRow[];
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildGroups(items: TaskRow[]): Group[] {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const now = new Date();

  const overdue: TaskRow[] = [];
  const pinned: TaskRow[] = [];
  const todayList: TaskRow[] = [];
  const tomorrowList: TaskRow[] = [];
  const later: TaskRow[] = [];
  const done: TaskRow[] = [];

  for (const t of items) {
    if (t.isDone) {
      done.push(t);
      continue;
    }
    const dl = t.deadline ? new Date(t.deadline) : null;
    if (dl && dl < now) {
      overdue.push(t);
      continue;
    }
    if (t.isPinned) {
      pinned.push(t);
      continue;
    }
    if (!dl) {
      todayList.push(t);
      continue;
    }
    if (dl < tomorrow) todayList.push(t);
    else if (dl < dayAfter) tomorrowList.push(t);
    else later.push(t);
  }

  const groups: Group[] = [];
  if (overdue.length) groups.push({ key: 'overdue', label: 'Просрочено', items: overdue });
  if (pinned.length) groups.push({ key: 'pinned', label: 'Закреплённые', items: pinned });
  if (todayList.length) groups.push({ key: 'today', label: 'Сегодня', items: todayList });
  if (tomorrowList.length) groups.push({ key: 'tomorrow', label: 'Завтра', items: tomorrowList });
  if (later.length) groups.push({ key: 'later', label: 'Позже', items: later });
  if (done.length) groups.push({ key: 'done', label: 'Сделано', items: done });
  return groups;
}

type Props = {
  items: TaskRow[];
  filter: 'active' | 'done' | 'all';
  query: string;
};

export function TaskList({ items, filter, query }: Props) {
  const [richEditorOpen, setRichEditorOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<GroupKey>>(new Set(['done']));

  // Global hotkey for "?"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.isContentEditable ||
        t.closest?.('[role="dialog"]')
      ) {
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Effective selection — filter out IDs that are no longer in the list (after delete / filter change).
  const idsInList = useMemo(() => new Set(items.map((t) => t.id)), [items]);
  const effectiveSelected = useMemo(() => {
    const next = new Set<string>();
    for (const id of selected) if (idsInList.has(id)) next.add(id);
    return next;
  }, [selected, idsInList]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapsed = (k: GroupKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const groups = useMemo(() => {
    if (filter === 'active' || filter === 'all') return buildGroups(items);
    return [{ key: 'done' as const, label: 'Сделано', items }];
  }, [items, filter]);

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-4">
      <TaskFilters
        initialFilter={filter}
        initialQuery={query}
        selectionMode={selectionMode}
        onToggleSelectionMode={() => {
          setSelectionMode((m) => {
            const next = !m;
            if (!next) setSelected(new Set());
            return next;
          });
        }}
        onShowShortcuts={() => setShowShortcuts(true)}
        selectionCount={effectiveSelected.size}
      />

      <QuickAddBar
        onExpand={() => setRichEditorOpen(true)}
        autoFocus={isEmpty && filter === 'active'}
      />

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-tasks)]/15 to-[var(--color-accent-tasks)]/5">
            <Sparkles size={28} strokeWidth={2} className="text-[var(--color-accent-tasks)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
              {filter === 'done' ? 'Пока ничего не сделано' : 'Чистый лист на сегодня'}
            </h3>
            <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
              {filter === 'done'
                ? 'Сделанные задачи появятся здесь.'
                : 'Запиши первую задачу — нажми N, чтобы начать.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            return (
              <section key={g.key} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(g.key)}
                  className="flex w-full items-center gap-2 px-1 text-left"
                >
                  <span
                    className={cn(
                      'text-[10px] font-semibold tracking-widest uppercase',
                      g.key === 'overdue'
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-fg-tertiary)]',
                    )}
                  >
                    {g.label}
                  </span>
                  <span
                    className={cn(
                      'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                      g.key === 'overdue'
                        ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]',
                    )}
                  >
                    {g.items.length}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn(
                      'ml-auto text-[var(--color-fg-tertiary)] transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                </button>
                {!isCollapsed && (
                  <ul className="space-y-1.5">
                    {g.items.map((t) => (
                      <TaskItem
                        key={t.id}
                        task={t}
                        selected={effectiveSelected.has(t.id)}
                        onToggleSelect={() => toggle(t.id)}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskBulkBar
        selected={effectiveSelected}
        onClear={() => setSelected(new Set())}
        onExitSelection={() => setSelectionMode(false)}
      />

      <TaskShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <Dialog open={richEditorOpen} onClose={() => setRichEditorOpen(false)} title="Новая задача">
        <TaskEditor
          submitLabel="Создать"
          onCancel={() => setRichEditorOpen(false)}
          onSubmit={async (data) => {
            const r = await createTaskAction(data);
            if (r.ok) setRichEditorOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}
