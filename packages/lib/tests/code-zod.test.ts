import { describe, it, expect } from 'vitest';

import { createSnippetSchema, updateSnippetSchema } from '../src/zod/code.js';

describe('code zod schemas', () => {
  it('createSnippetSchema accepts valid input with title and language', () => {
    const result = createSnippetSchema.safeParse({
      code: 'console.log("hello")',
      title: 'log helper',
      language: 'ts',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('console.log("hello")');
      expect(result.data.language).toBe('ts');
    }
  });

  it('createSnippetSchema rejects empty code', () => {
    const result = createSnippetSchema.safeParse({ code: '', title: 't' });
    expect(result.success).toBe(false);
  });

  it('updateSnippetSchema accepts partial fields', () => {
    const result = updateSnippetSchema.safeParse({ isPinned: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPinned).toBe(true);
      expect(result.data.code).toBeUndefined();
    }
  });
});
