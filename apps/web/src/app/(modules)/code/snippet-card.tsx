'use client';

import { ChevronDown, ChevronUp, Copy, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const lineCount = snippet.code.split('\n').length;
  const hasOverflow = lineCount > 5;

  const copy = () => {
    void navigator.clipboard
      .writeText(snippet.code)
      .then(() => toast.success('Скопировано'))
      .catch(() => toast.error('Не удалось скопировать'));
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
      else toast.error(r.error);
    });
  };

  if (editing) {
    return (
      <li className="space-y-2 rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Название (опц.)"
            maxLength={200}
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-fg-primary)] outline-none placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent-code)]"
          />
          <select
            value={editLang}
            onChange={(e) => setEditLang(e.target.value)}
            className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-accent-code)]"
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
          className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-accent-code)]"
          spellCheck={false}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setEditTitle(snippet.title ?? '');
              setEditCode(snippet.code);
              setEditLang(snippet.language ?? 'auto');
              setEditing(false);
            }}
          >
            Отмена
          </Button>
          <Button variant="primary" size="md" onClick={submitEdit} disabled={!editCode.trim()}>
            Сохранить
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'group rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3.5 transition-colors hover:border-[var(--color-border-default)]',
        snippet.isPinned && 'border-l-[3px] border-l-[var(--color-accent-code)]',
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-[var(--color-fg-primary)]">
          {snippet.title || (
            <span className="font-normal text-[var(--color-fg-tertiary)]">Без названия</span>
          )}
        </h3>
        {snippet.isPinned && (
          <Pin size={12} strokeWidth={2.6} className="shrink-0 text-[var(--color-accent-code)]" />
        )}
        {snippet.language && (
          <Badge variant="code" size="sm">
            {snippet.language}
          </Badge>
        )}
      </div>

      <div
        onClick={() => hasOverflow && setExpanded((v) => !v)}
        className={cn('mt-2.5', hasOverflow && 'cursor-pointer')}
      >
        <CodeBlock
          code={snippet.code}
          language={snippet.language}
          preview={expanded ? undefined : 5}
        />
        {hasOverflow && (
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-[var(--color-fg-tertiary)]">
            {expanded ? (
              <>
                <ChevronUp size={12} />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Показать ещё {lineCount - 5}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={copy}
          className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
        >
          <Copy size={12} />
          Копировать
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
        >
          <Pencil size={12} />
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => void togglePinAction(snippet.id)}
          className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
        >
          {snippet.isPinned ? (
            <>
              <PinOff size={12} />
              Открепить
            </>
          ) : (
            <>
              <Pin size={12} />
              Закрепить
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="ml-auto flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          aria-label="Удалить"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить сниппет?"
        description="Сниппет будет удалён без возможности восстановления."
        confirmLabel="Удалить"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const r = await deleteSnippetAction(snippet.id);
          setDeleting(false);
          setConfirmDelete(false);
          if (r.ok) toast.success('Сниппет удалён');
          else toast.error(r.error);
        }}
      />
    </li>
  );
}
