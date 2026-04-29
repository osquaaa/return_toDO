import { describe, it, expect } from 'vitest';

import { addItemSchema, updateItemSchema, reorderItemsSchema } from '../src/zod/shopping.js';

describe('shopping zod schemas', () => {
  it('addItemSchema rejects empty name', () => {
    const result = addItemSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('addItemSchema accepts valid input with optional quantity', () => {
    const result = addItemSchema.safeParse({ name: 'Молоко', quantity: '1 л' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Молоко');
      expect(result.data.quantity).toBe('1 л');
    }
  });

  it('updateItemSchema rejects when isDone is not bool', () => {
    const result = updateItemSchema.safeParse({ isDone: 'yes' });
    expect(result.success).toBe(false);
  });

  it('reorderItemsSchema accepts list of id+position pairs', () => {
    const result = reorderItemsSchema.safeParse({
      items: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
