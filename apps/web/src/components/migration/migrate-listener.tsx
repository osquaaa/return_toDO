'use client';

import { useEffect } from 'react';

const STORAGE_FLAG = 'letget:migrated';

type V1Payload = {
  tasks: unknown[];
  shopping: { trips: unknown[]; items: unknown[] };
  code: unknown[];
  workouts: { exercises: unknown[]; sets: unknown[] };
};

function readV1FromLocalStorage(): V1Payload | null {
  const get = (k: string): unknown => {
    try {
      const raw = localStorage.getItem(`letget:${k}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const tasks = (get('tasks') as unknown[]) ?? [];
  const shopping = (get('shopping') as { trips?: unknown[]; items?: unknown[] }) ?? {
    trips: [],
    items: [],
  };
  const code = (get('code') as unknown[]) ?? [];
  const workouts = (get('workouts') as { exercises?: unknown[]; sets?: unknown[] }) ?? {
    exercises: [],
    sets: [],
  };
  const empty =
    Array.isArray(tasks) &&
    tasks.length === 0 &&
    (shopping.trips ?? []).length === 0 &&
    (shopping.items ?? []).length === 0 &&
    Array.isArray(code) &&
    code.length === 0 &&
    (workouts.exercises ?? []).length === 0 &&
    (workouts.sets ?? []).length === 0;
  if (empty) return null;
  return {
    tasks,
    shopping: { trips: shopping.trips ?? [], items: shopping.items ?? [] },
    code,
    workouts: { exercises: workouts.exercises ?? [], sets: workouts.sets ?? [] },
  };
}

type MigrateResponse = { alreadyMigrated: boolean; counts?: Record<string, number> };

export function MigrateListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_FLAG) === '1') return;
    const payload = readV1FromLocalStorage();
    if (!payload) {
      localStorage.setItem(STORAGE_FLAG, '1');
      return;
    }
    void (async () => {
      try {
        const r = await fetch('/api/migrate/v1', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) return;
        const data = (await r.json()) as MigrateResponse;
        localStorage.setItem(STORAGE_FLAG, '1');
        if (!data.alreadyMigrated && data.counts) {
          const c = data.counts;
          const summary = `Импортировано: ${c.tasks ?? 0} задач, ${c.shoppingTrips ?? 0} походов, ${c.codeSnippets ?? 0} сниппетов, ${c.workoutSets ?? 0} подходов`;
          console.info(summary);
          const { toast } = await import('sonner');
          toast.success('Данные перенесены', { description: summary, duration: 6000 });
        }
      } catch (err) {
        console.warn('migration failed', err);
      }
    })();
  }, []);

  return null;
}
