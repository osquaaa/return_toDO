'use client';

import { useState, useTransition } from 'react';

import { CodeBlock } from './code-block';
import { deleteSnippetAction, togglePinAction, updateSnippetAction } from './actions';
import type { SnippetRow } from './snippet-list';

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

export function SnippetCard({ snippet }: { snippet: SnippetRow }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(snippet.title ?? '');
  const [editCode, setEditCode] = useState(snippet.code);
  const [editLang, setEditLang] = useState(snippet.language ?? 'auto');
  const [, startTransition] = useTransition();

  const lineCount = snippet.code.split('\n').length;
  const hasOverflow = lineCount > 5;

  const copy = () => {
    void navigator.clipboard
      .writeText(snippet.code)
      .then(() => alert('Скопировано'))
      .catch(() => alert('Не удалось скопировать'));
  };

  const submitEdit = () => {
    const trimmed = editCode.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const r = await updateSnippetAction(snippet.id, {
        code: trimmed,
        title: editTitle.trim() || null,
        language: editLang === 'auto' ? null : editLang,
      });
      if (r.ok) setEditing(false);
      else alert(r.error);
    });
  };

  if (editing) {
    return (
      <li className="space-y-2 rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Название (опц.)"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm focus:border-[var(--color-code-to)] focus:outline-none"
          />
          <select
            value={editLang}
            onChange={(e) => setEditLang(e.target.value)}
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
          value={editCode}
          onChange={(e) => setEditCode(e.target.value)}
          rows={Math.min(20, Math.max(8, lineCount))}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 font-mono text-xs leading-relaxed focus:border-[var(--color-code-to)] focus:outline-none"
          spellCheck={false}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setEditTitle(snippet.title ?? '');
              setEditCode(snippet.code);
              setEditLang(snippet.language ?? 'auto');
              setEditing(false);
            }}
            className="rounded-xl px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={submitEdit}
            disabled={!editCode.trim()}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--color-code-from), var(--color-code-to))',
            }}
          >
            Сохранить
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group rounded-2xl bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] ${
        snippet.isPinned ? 'border-l-4 border-[var(--color-code-from)]' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className="flex-1 truncate text-sm font-medium">
          {snippet.title || <span className="text-[var(--color-ink-soft)]">Без названия</span>}
        </h3>
        {snippet.language && (
          <span
            className="rounded-md px-2 py-0.5 text-xs font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-code-from), var(--color-code-to))',
            }}
          >
            {snippet.language}
          </span>
        )}
      </div>

      <div
        onClick={() => hasOverflow && setExpanded((v) => !v)}
        className={hasOverflow ? 'mt-2 cursor-pointer' : 'mt-2'}
      >
        <CodeBlock
          code={snippet.code}
          language={snippet.language}
          preview={expanded ? undefined : 5}
        />
        {hasOverflow && !expanded && (
          <div className="mt-1 text-center text-xs text-[var(--color-ink-soft)]">
            Показать ещё {lineCount - 5}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs">
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2 py-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
        >
          Копировать
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => void togglePinAction(snippet.id)}
          className="rounded-md px-2 py-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
        >
          {snippet.isPinned ? 'Открепить' : 'Закрепить'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Удалить сниппет?')) void deleteSnippetAction(snippet.id);
          }}
          className="ml-auto rounded-md px-2 py-1 text-[var(--color-ink-soft)] hover:bg-red-50 hover:text-red-600"
        >
          Удалить
        </button>
      </div>
    </li>
  );
}
