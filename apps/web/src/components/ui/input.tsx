'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  error?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { iconLeft, iconRight, error, inputSize = 'md', className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {iconLeft && (
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]">
          {iconLeft}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] outline-none transition-colors duration-[var(--duration-fast)] placeholder:text-[var(--color-fg-tertiary)]',
          'focus:border-[var(--color-fg-secondary)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          sizeClasses[inputSize],
          iconLeft ? 'pl-10' : 'pl-3.5',
          iconRight ? 'pr-10' : 'pr-3.5',
          error
            ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
            : 'border-[var(--color-border-default)]',
          className,
        )}
        {...rest}
      />
      {iconRight && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]">
          {iconRight}
        </div>
      )}
    </div>
  );
});
