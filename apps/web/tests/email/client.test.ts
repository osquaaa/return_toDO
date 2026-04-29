import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('email client', () => {
  it('uses dev stub when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const { sendEmail } = await import('../../src/lib/email/client');
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendEmail({ to: 'a@b.c', subject: 'hi', html: '<b>hi</b>', text: 'hi' });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
