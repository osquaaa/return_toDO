'use client';

import { useMemo } from 'react';
import hljs from 'highlight.js';
import DOMPurify from 'isomorphic-dompurify';

// highlight.js escapes user input internally and returns HTML containing only
// span tags with class attributes. We additionally pass it through DOMPurify
// to keep the security boundary explicit.
const PURIFY_OPTS = {
  ALLOWED_TAGS: ['span'],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
};

export function CodeBlock({
  code,
  language,
  preview,
}: {
  code: string;
  language: string | null;
  preview?: number;
}) {
  const display = useMemo(() => {
    if (preview && preview > 0) {
      const lines = code.split('\n').slice(0, preview);
      return lines.join('\n');
    }
    return code;
  }, [code, preview]);

  const highlighted = useMemo(() => {
    let raw: string;
    try {
      if (language && language !== 'auto' && hljs.getLanguage(language)) {
        raw = hljs.highlight(display, { language, ignoreIllegals: true }).value;
      } else {
        raw = hljs.highlightAuto(display).value;
      }
    } catch {
      raw = escapeHtml(display);
    }
    return DOMPurify.sanitize(raw, PURIFY_OPTS);
  }, [display, language]);

  return (
    <pre className="overflow-x-auto rounded-xl bg-[var(--color-bg-subtle)] p-3 text-xs leading-relaxed">
      <code
        className={`hljs ${language ? `language-${language}` : ''}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
