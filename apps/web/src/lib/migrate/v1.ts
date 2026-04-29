import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import {
  userPreferences,
  tasks,
  shoppingTrips,
  shoppingItems,
  codeSnippets,
  workoutExercises,
  workoutSets,
} from '@letget/db/schema';
import { v1MigrationSchema } from '@letget/lib/zod/migrate';
import type { z } from 'zod';

import { sanitizeHtml, htmlToPlainText } from '../sanitize';

const { db } = createDbClient();

type Counts = {
  tasks: number;
  shoppingTrips: number;
  shoppingItems: number;
  codeSnippets: number;
  workoutExercises: number;
  workoutSets: number;
};

type ImportResult = { alreadyMigrated: boolean; counts: Counts };

type V1Input = z.input<typeof v1MigrationSchema>;

const emptyCounts = (): Counts => ({
  tasks: 0,
  shoppingTrips: 0,
  shoppingItems: 0,
  codeSnippets: 0,
  workoutExercises: 0,
  workoutSets: 0,
});

const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'exercise'
  );
}

export async function importV1(userId: string, input: V1Input): Promise<ImportResult> {
  const payload = v1MigrationSchema.parse(input);

  return await db.transaction(async (tx) => {
    const prefs = await tx.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    if (prefs.length > 0 && prefs[0].migratedV1At) {
      return { alreadyMigrated: true, counts: emptyCounts() };
    }

    const counts = emptyCounts();

    if (payload.tasks.length > 0) {
      const rows = payload.tasks.map((t) => {
        const html = t.htmlText ? sanitizeHtml(t.htmlText) : `<p>${escapeHtml(t.text)}</p>`;
        const text = t.htmlText ? htmlToPlainText(t.htmlText) : t.text;
        return {
          id: genId(),
          userId,
          contentHtml: html,
          contentText: text,
          isDone: t.isDone,
          isPinned: t.isPinned,
          deadline: parseDate(t.deadline ?? null),
          doneAt: parseDate(t.doneAt ?? null),
          createdAt: parseDate(t.createdAt ?? null) ?? new Date(),
          updatedAt: parseDate(t.updatedAt ?? null) ?? new Date(),
        };
      });
      await tx.insert(tasks).values(rows);
      counts.tasks = rows.length;
    }

    const tripIdMap = new Map<string, string>();
    if (payload.shopping.trips.length > 0) {
      const rows = payload.shopping.trips.map((tr) => {
        const newId = genId();
        tripIdMap.set(tr.id, newId);
        return {
          id: newId,
          userId,
          name: tr.name,
          isCurrent: tr.isCurrent,
          completedAt: parseDate(tr.completedAt ?? null),
          createdAt: parseDate(tr.createdAt ?? null) ?? new Date(),
          updatedAt: new Date(),
        };
      });
      await tx.insert(shoppingTrips).values(rows);
      counts.shoppingTrips = rows.length;
    }

    if (payload.shopping.items.length > 0) {
      const rows = payload.shopping.items
        .filter((it) => tripIdMap.has(it.tripId))
        .map((it) => ({
          id: genId(),
          tripId: tripIdMap.get(it.tripId)!,
          name: it.name,
          quantity: it.quantity ?? null,
          isDone: it.isDone,
          position: it.position,
          doneAt: parseDate(it.doneAt ?? null),
          createdAt: parseDate(it.createdAt ?? null) ?? new Date(),
        }));
      if (rows.length > 0) {
        await tx.insert(shoppingItems).values(rows);
        counts.shoppingItems = rows.length;
      }
    }

    if (payload.code.length > 0) {
      const rows = payload.code.map((c) => ({
        id: genId(),
        userId,
        title: c.title ?? null,
        code: c.code,
        language: c.lang ?? null,
        isPinned: c.isPinned,
        createdAt: parseDate(c.createdAt ?? null) ?? new Date(),
        updatedAt: parseDate(c.updatedAt ?? null) ?? new Date(),
      }));
      await tx.insert(codeSnippets).values(rows);
      counts.codeSnippets = rows.length;
    }

    const exIdMap = new Map<string, string>();
    if (payload.workouts.exercises.length > 0) {
      const rows = payload.workouts.exercises.map((e) => {
        const newId = genId();
        exIdMap.set(e.id, newId);
        return {
          id: newId,
          userId,
          name: e.name,
          slug: slugify(e.name),
          icon: e.icon ?? null,
          archivedAt: parseDate(e.archivedAt ?? null),
          createdAt: new Date(),
        };
      });
      await tx.insert(workoutExercises).values(rows);
      counts.workoutExercises = rows.length;
    }

    if (payload.workouts.sets.length > 0) {
      const rows = payload.workouts.sets
        .filter((s) => exIdMap.has(s.exerciseId))
        .map((s) => ({
          id: genId(),
          userId,
          exerciseId: exIdMap.get(s.exerciseId)!,
          reps: s.reps,
          notes: s.notes ?? null,
          performedAt: parseDate(s.performedAt ?? null) ?? new Date(),
        }));
      if (rows.length > 0) {
        await tx.insert(workoutSets).values(rows);
        counts.workoutSets = rows.length;
      }
    }

    if (prefs.length > 0) {
      await tx
        .update(userPreferences)
        .set({ migratedV1At: new Date(), updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    } else {
      await tx.insert(userPreferences).values({ userId, migratedV1At: new Date() });
    }

    return { alreadyMigrated: false, counts };
  });
}
