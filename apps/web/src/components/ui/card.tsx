import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'outlined' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
};

const variantClasses = {
  default: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
  elevated: 'bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]',
  outlined: 'bg-transparent border border-[var(--color-border-default)]',
  subtle: 'bg-[var(--color-bg-subtle)]',
};

const paddingClasses = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' };

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)]',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
