import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, codeSnippets } from '@letget/db/schema';
import {
  createSnippet,
  updateSnippet,
  softDeleteSnippet,
  togglePin,
} from '../../src/lib/code/mutations';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `cm-${id}@test.local`, role: 'user' });
  return id;
}

describe('createSnippet', () => {
  it('persists code as-is (no sanitize)', async () => {
    const userId = await makeUser();
    const row = await createSnippet(userId, {
      code: '<script>alert(1)</script>',
      title: 'raw',
      language: 'html',
    });
    expect(row.code).toBe('<script>alert(1)</script>');
    expect(row.title).toBe('raw');
    expect(row.language).toBe('html');
    expect(row.isPinned).toBe(false);
  });

  it('handles null title and language', async () => {
    const userId = await makeUser();
    const row = await createSnippet(userId, { code: 'x = 1' });
    expect(row.title).toBeNull();
    expect(row.language).toBeNull();
  });
});

describe('updateSnippet', () => {
  it('enforces ownership — other user cannot update', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const created = await createSnippet(owner, { code: 'mine', title: 'orig' });
    const result = await updateSnippet(intruder, created.id, { code: 'hacked' });
    expect(result).toBeNull();
    const fresh = await db.select().from(codeSnippets).where(eq(codeSnippets.id, created.id));
    expect(fresh[0].code).toBe('mine');
  });

  it('updates code and language', async () => {
    const userId = await makeUser();
    const created = await createSnippet(userId, { code: 'a', language: 'ts' });
    const updated = await updateSnippet(userId, created.id, { code: 'b', language: 'js' });
    expect(updated).not.toBeNull();
    expect(updated!.code).toBe('b');
    expect(updated!.language).toBe('js');
  });
});

describe('softDeleteSnippet', () => {
  it('returns false when snippet is not owned', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const created = await createSnippet(owner, { code: 'mine' });
    const ok = await softDeleteSnippet(intruder, created.id);
    expect(ok).toBe(false);
    const fresh = await db.select().from(codeSnippets).where(eq(codeSnippets.id, created.id));
    expect(fresh[0].deletedAt).toBeNull();
  });

  it('returns true on success and stamps deletedAt', async () => {
    const userId = await makeUser();
    const created = await createSnippet(userId, { code: 'bye' });
    const ok = await softDeleteSnippet(userId, created.id);
    expect(ok).toBe(true);
    const fresh = await db.select().from(codeSnippets).where(eq(codeSnippets.id, created.id));
    expect(fresh[0].deletedAt).not.toBeNull();
  });
});

describe('togglePin', () => {
  it('flips isPinned and returns new state', async () => {
    const userId = await makeUser();
    const created = await createSnippet(userId, { code: 'x' });
    expect(created.isPinned).toBe(false);
    const next = await togglePin(userId, created.id);
    expect(next).toBe(true);
    const fresh = await db.select().from(codeSnippets).where(eq(codeSnippets.id, created.id));
    expect(fresh[0].isPinned).toBe(true);
    const back = await togglePin(userId, created.id);
    expect(back).toBe(false);
  });

  it('returns null when not owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const created = await createSnippet(owner, { code: 'x' });
    const result = await togglePin(intruder, created.id);
    expect(result).toBeNull();
  });
});
