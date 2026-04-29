'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

type EditorInstance = NonNullable<ReturnType<typeof useEditor>>;

type Props = {
  initialHtml?: string;
  initialDeadline?: string | null;
  initialPinned?: boolean;
  onSubmit: (data: { contentHtml: string; deadline: string | null; isPinned: boolean }) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function TaskEditor({
  initialHtml = '',
  initialDeadline = null,
  initialPinned = false,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
}: Props) {
  const [deadline, setDeadline] = useState<string>(
    initialDeadline ? initialDeadline.slice(0, 16) : '',
  );
  const [isPinned, setIsPinned] = useState<boolean>(initialPinned);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Что нужно сделать?' }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          'min-h-[80px] max-h-[40vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)] prose prose-sm max-w-none',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="space-y-3">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[var(--color-ink-soft)]">Дедлайн:</span>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          <span>Закрепить</span>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-canvas)]"
          >
            Отмена
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onSubmit({
              contentHtml: editor.getHTML(),
              deadline: deadline ? new Date(deadline).toISOString() : null,
              isPinned,
            })
          }
          className="rounded-xl bg-[var(--color-ink)] px-4 py-1.5 text-sm text-[var(--color-canvas)]"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: EditorInstance }) {
  const btn = (active: boolean) =>
    `rounded-md px-2 py-1 text-sm hover:bg-[var(--color-canvas)] ${
      active ? 'bg-[var(--color-canvas)] font-bold' : ''
    }`;
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </button>
      <button
        type="button"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </button>
      <button
        type="button"
        className={btn(editor.isActive('link'))}
        onClick={() => {
          const prev = editor.getAttributes('link').href as string | undefined;
          const url = window.prompt('URL', prev ?? '');
          if (url === null) return;
          if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
          else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
      >
        🔗
      </button>
    </div>
  );
}
