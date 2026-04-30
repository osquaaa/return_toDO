'use client';

import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
  secondary:
    'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]',
  ghost:
    'bg-transparent text-[var(--color-fg-primary)] hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    iconLeft,
    iconRight,
    fullWidth,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold tracking-tight transition-all duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-from)] focus-visible:ring-offset-[var(--color-bg-app)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'lg' ? 18 : 14} className="animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});
