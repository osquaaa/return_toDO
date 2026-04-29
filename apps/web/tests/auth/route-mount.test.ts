import { describe, it, expect } from 'vitest';
import * as route from '../../src/app/api/auth/[...all]/route';

describe('auth catch-all route', () => {
  it('exports GET and POST handlers', () => {
    expect(route.GET).toBeTypeOf('function');
    expect(route.POST).toBeTypeOf('function');
  });
});
