import { describe, it, expect } from 'vitest';

import { genId } from '../src/id.js';

describe('genId (UUID v7)', () => {
  it('returns a UUID v7 string', () => {
    const id = genId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns sortable IDs (later ID > earlier ID lexicographically)', async () => {
    const a = genId();
    await new Promise((r) => setTimeout(r, 5));
    const b = genId();
    expect(b > a).toBe(true);
  });

  it('returns unique IDs across 1000 generations', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => genId()));
    expect(ids.size).toBe(1000);
  });
});
