'use client';

import { Calendar, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

import { createTaskAction } from './actions';

type Props = {
  onExpand: () => void;
  autoFocus?: boolean;
};

export function QuickAddBar({ onExpand, autoFocus = false }: Props) {
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.isContentEditable ||
        t.closest?.('[role="dialog"]')
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N' || e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    const dl = deadline ? new Date(deadline).toISOString() : null;
    setText('');
    setDeadline('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    startTransition(async () => {
      const r = await createTaskAction({
        contentHtml: `<p>${escape(value)}</p>`,
        deadline: dl,
        isPinned: false,
      });
      if (!r.ok) {
        toast.error(r.error);
        setText(value);
      }
    });
  };

  const fmtDeadline = (v: string) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="sticky top-14 z-10 -mx-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app)]/85 px-4 py-2.5 backdrop-blur-xl md:top-16 md:-mx-8 md:px-8">
      <div className="flex items-start gap-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2.5 shadow-[var(--shadow-xs)] transition-shadow focus-within:border-[var(--color-fg-tertiary)] focus-within:shadow-[var(--shadow-sm)]">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || isPending}
          aria-label="Добавить"
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)] transition-opacity disabled:opacity-30"
        >
          <Plus size={14} strokeWidth={2.6} />
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (e.metaKey || e.ctrlKey) {
                onExpand();
              } else {
                submit();
              }
            } else if (e.key === 'Escape') {
              setText('');
              setDeadline('');
              if (inputRef.current) inputRef.current.style.height = 'auto';
              inputRef.current?.blur();
            }
          }}
          placeholder="Что нужно сделать?  Enter — сохранить · ⇧Enter — новая строка"
          className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 text-[var(--color-fg-primary)] outline-none placeholder:text-[var(--color-fg-tertiary)]"
        />
        <div className="flex shrink-0 items-center gap-1 self-start pt-0.5">
          <label
            className={cn(
              'relative flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs transition-colors',
              deadline
                ? 'bg-[var(--color-accent-tasks-soft)] text-[var(--color-accent-tasks)]'
                : 'text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]',
            )}
          >
            <Calendar size={13} strokeWidth={2.4} />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-label="Дедлайн"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="hidden whitespace-nowrap sm:inline">
              {deadline ? fmtDeadline(deadline) : 'Дедлайн'}
            </span>
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={onExpand}
            aria-label="Расширенный редактор"
            className="!h-7 !px-2"
            title="⌘+Enter"
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
