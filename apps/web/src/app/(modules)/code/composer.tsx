'use client';

import { useRef, useState, useTransition } from 'react';

import { createSnippetAction } from './actions';

const LANGUAGES = [
  { value: 'auto', label: 'Авто' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'js', label: 'JavaScript' },
  { value: 'py', label: 'Python' },
  { value: 'sh', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'md', label: 'Markdown' },
];

export function Composer() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('auto');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setTitle('');
    setLanguage('auto');
    setCode('');
    setError(null);
  };

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Код не может быть пустым');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await createSnippetAction({
        code: trimmed,
        title: title.trim() || null,
        language: language === 'auto' ? null : language,
      });
      if (r.ok) {
        reset();
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => codeRef.current?.focus(), 0);
        }}
        className="w-full rounded-2xl border-2 border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
      >
        + Новый сниппет
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название (опц.)"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm focus:border-[var(--color-code-to)] focus:outline-none"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm focus:border-[var(--color-code-to)] focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        ref={codeRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        placeholder="Вставьте код…"
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 font-mono text-xs leading-relaxed focus:border-[var(--color-code-to)] focus:outline-none"
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-xl px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          Отмена
        </button>
        <button
          type="button"
          disabled={isPending || !code.trim()}
          onClick={submit}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-code-from), var(--color-code-to))',
          }}
        >
          Создать
        </button>
      </div>
    </div>
  );
}
