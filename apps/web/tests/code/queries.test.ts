import { describe, it, expect } from 'vitest';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, codeSnippets } from '@letget/db/schema';
import { listSnippets, getSnippet } from '../../src/lib/code/queries';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `cq-${id}@test.local`, role: 'user' });
  return id;
}

async function seed(userId: string) {
  await db.insert(codeSnippets).values([
    {
      id: genId(),
      userId,
      title: 'helper',
      code: 'console.log("hello")',
      language: 'ts',
      isPinned: true,
    },
    {
      id: genId(),
      userId,
      title: 'sql query',
      code: 'select * from users',
      language: 'sql',
      isPinned: false,
    },
    {
      id: genId(),
      userId,
      title: 'shell',
      code: 'echo привет',
      language: 'sh',
      isPinned: false,
    },
  ]);
}

describe('listSnippets', () => {
  it('returns all non-deleted, pinned first', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listSnippets(userId);
    expect(rows.length).toBe(3);
    expect(rows[0].isPinned).toBe(true);
  });

  it('pinned=true returns only pinned', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listSnippets(userId, { pinned: true });
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe('helper');
  });

  it('search matches via tsvector on code', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listSnippets(userId, { q: 'привет' });
    expect(rows.length).toBe(1);
    expect(rows[0].language).toBe('sh');
  });

  it('does not return snippets from another user', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    await seed(owner);
    const rows = await listSnippets(intruder);
    expect(rows.length).toBe(0);
  });
});

describe('getSnippet', () => {
  it('returns snippet when owner matches', async () => {
    const userId = await makeUser();
    const id = genId();
    await db.insert(codeSnippets).values({ id, userId, code: 'x' });
    const got = await getSnippet(userId, id);
    expect(got).not.toBeNull();
    expect(got?.id).toBe(id);
  });

  it('returns null when owner mismatches', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const id = genId();
    await db.insert(codeSnippets).values({ id, userId: owner, code: 'private' });
    const got = await getSnippet(intruder, id);
    expect(got).toBeNull();
  });
});
