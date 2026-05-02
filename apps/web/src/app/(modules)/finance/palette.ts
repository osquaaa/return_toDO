/** Preset palette for finance category colors. Hex picked to read on both themes. */
export const FINANCE_COLORS: { key: string; hex: string }[] = [
  { key: 'teal', hex: '#14b8a6' },
  { key: 'emerald', hex: '#10b981' },
  { key: 'sky', hex: '#3b82f6' },
  { key: 'violet', hex: '#8b5cf6' },
  { key: 'rose', hex: '#f43f5e' },
  { key: 'amber', hex: '#f59e0b' },
  { key: 'lime', hex: '#84cc16' },
  { key: 'fuchsia', hex: '#d946ef' },
  { key: 'slate', hex: '#64748b' },
];

const KEY_TO_HEX = new Map(FINANCE_COLORS.map((c) => [c.key, c.hex]));

/** Resolve stored color (key or raw hex) to a CSS color string. Falls back to finance accent. */
export function resolveColor(input: string | null | undefined): string {
  if (!input) return 'var(--color-accent-finance)';
  const mapped = KEY_TO_HEX.get(input);
  if (mapped) return mapped;
  return input;
}

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const RUB_PRECISE = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export function formatRub(value: number, precise = false): string {
  return precise ? RUB_PRECISE.format(value) : RUB.format(value);
}

export function formatRubSigned(value: number): string {
  if (value === 0) return RUB.format(0);
  const sign = value > 0 ? '+' : '−';
  return `${sign}${RUB.format(Math.abs(value))}`;
}
