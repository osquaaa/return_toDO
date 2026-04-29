import { describe, it, expect } from 'vitest';
import { verifyEmailTemplate, resetPasswordTemplate } from '../../src/lib/email/templates';

describe('email templates', () => {
  it('verifyEmailTemplate produces all three fields with the URL embedded', () => {
    const t = verifyEmailTemplate({ name: 'Иван', url: 'https://example.test/x' });
    expect(t.subject).toMatch(/LETget/i);
    expect(t.html).toContain('https://example.test/x');
    expect(t.text).toContain('https://example.test/x');
  });
  it('resetPasswordTemplate works similarly', () => {
    const t = resetPasswordTemplate({ name: null, url: 'https://example.test/r' });
    expect(t.html).toContain('https://example.test/r');
    expect(t.text).toContain('https://example.test/r');
  });
});
