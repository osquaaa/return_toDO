import { cn } from '@/lib/cn';

type AvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeClasses = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

function initials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
  if (email) return email[0]?.toUpperCase() ?? '?';
  return '?';
}

export function Avatar({ name, email, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-full)] bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] font-semibold tracking-tight text-[var(--color-brand-fg)]',
        sizeClasses[size],
        className,
      )}
    >
      {initials(name, email)}
    </div>
  );
}
