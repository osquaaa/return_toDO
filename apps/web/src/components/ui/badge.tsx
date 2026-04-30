import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant =
  | 'tasks'
  | 'shopping'
  | 'code'
  | 'workouts'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'brand';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
  children?: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  tasks: 'bg-[var(--color-accent-tasks-soft)] text-[var(--color-accent-tasks)]',
  shopping: 'bg-[var(--color-accent-shopping-soft)] text-[var(--color-accent-shopping)]',
  code: 'bg-[var(--color-accent-code-soft)] text-[var(--color-accent-code)]',
  workouts: 'bg-[var(--color-accent-workouts-soft)] text-[var(--color-accent-workouts)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  neutral: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]',
  brand:
    'bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)]',
};

const sizeClasses = { sm: 'h-5 px-1.5 text-[10px]', md: 'h-6 px-2 text-xs' };

export function Badge({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] font-medium tracking-wider uppercase',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
