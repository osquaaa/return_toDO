'use client';

import { Check } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Accent = 'brand' | 'tasks' | 'shopping' | 'code' | 'workouts' | 'success';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  size?: 'sm' | 'md';
  accent?: Accent;
};

const accentMap: Record<Accent, string> = {
  brand: 'var(--color-brand-from)',
  tasks: 'var(--color-accent-tasks)',
  shopping: 'var(--color-accent-shopping)',
  code: 'var(--color-accent-code)',
  workouts: 'var(--color-accent-workouts)',
  success: 'var(--color-success)',
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { size = 'md', accent = 'tasks', className, checked, ...rest },
  ref,
) {
  const dim = size === 'sm' ? 16 : 20;
  const color = accentMap[accent];
  return (
    <label
      className={cn('relative inline-flex shrink-0 cursor-pointer', className)}
      style={{ width: dim, height: dim }}
    >
      <input ref={ref} type="checkbox" checked={checked} className="peer sr-only" {...rest} />
      <span
        className="absolute inset-0 flex items-center justify-center rounded-[6px] border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] transition-all duration-[var(--duration-fast)] peer-hover:border-[var(--color-fg-tertiary)] peer-checked:border-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1"
        style={{
          backgroundColor: checked ? color : undefined,
          ['--tw-ring-color' as string]: color,
        }}
      >
        <Check
          size={size === 'sm' ? 10 : 14}
          strokeWidth={3.5}
          className={cn(
            'text-white transition-all duration-[var(--duration-fast)]',
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        />
      </span>
    </label>
  );
});
