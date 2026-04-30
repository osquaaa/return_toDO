'use client';

import { Plus, ShoppingBag } from 'lucide-react';
import { useId, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { addItemAction } from './actions';

export function Composer({ suggestions }: { suggestions: string[] }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const r = await addItemAction({
        name: trimmed,
        quantity: quantity.trim() || null,
      });
      if (r.ok) {
        setName('');
        setQuantity('');
        nameRef.current?.focus();
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <Input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Что добавить?"
            list={listId}
            inputSize="md"
            iconLeft={<ShoppingBag size={14} />}
            autoFocus
          />
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="w-28 shrink-0">
          <Input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Кол-во"
            inputSize="md"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={isPending}
          disabled={!name.trim()}
          onClick={submit}
          iconLeft={!isPending ? <Plus size={14} /> : undefined}
          className="shrink-0"
        >
          Добавить
        </Button>
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
