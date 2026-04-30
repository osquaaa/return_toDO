'use client';

import { Plus } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

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
        toast.success('Сниппет создан');
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
        className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]/50 px-4 py-3 text-left text-sm transition-all hover:border-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-elevated)]"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)]">
          <Plus size={14} strokeWidth={2.6} />
        </span>
        <span className="text-[var(--color-fg-secondary)] group-hover:text-[var(--color-fg-primary)]">
          Новый сниппет…
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название (опц.)"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-fg-primary)] outline-none placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent-code)]"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
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
        ref={codeRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        placeholder="Вставь код…"
        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-accent-code)]"
        spellCheck={false}
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Отмена
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={isPending}
          disabled={!code.trim()}
          onClick={submit}
        >
          Создать
        </Button>
      </div>
    </div>
  );
}
