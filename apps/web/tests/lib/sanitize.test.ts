import { describe, it, expect } from 'vitest';

import { sanitizeHtml, htmlToPlainText } from '../../src/lib/sanitize';

describe('sanitizeHtml', () => {
  it('strips scripts and on-handlers', () => {
    const input = '<p>Hi <script>alert(1)</script> <a href="x" onclick="bad()">link</a></p>';
    const out = sanitizeHtml(input);
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
  });
  it('htmlToPlainText returns text content', () => {
    expect(htmlToPlainText('<p>Hi <b>there</b></p>')).toContain('Hi');
    expect(htmlToPlainText('<p>Hi <b>there</b></p>')).not.toContain('<');
  });
});
