/** Preset palette for habit colors. Hex picked to read on both themes. */
export const HABIT_COLORS: { key: string; hex: string }[] = [
  { key: 'sky', hex: '#3b82f6' },
  { key: 'emerald', hex: '#10b981' },
  { key: 'amber', hex: '#f59e0b' },
  { key: 'rose', hex: '#f43f5e' },
  { key: 'violet', hex: '#8b5cf6' },
  { key: 'fuchsia', hex: '#d946ef' },
  { key: 'lime', hex: '#84cc16' },
  { key: 'slate', hex: '#64748b' },
];

const KEY_TO_HEX = new Map(HABIT_COLORS.map((c) => [c.key, c.hex]));

/** Resolve stored color (key or raw hex) to a CSS color string. Falls back to habits accent. */
export function resolveColor(input: string | null | undefined): string {
  if (!input) return 'var(--color-accent-habits)';
  // If it's a known key, map to hex.
  const mapped = KEY_TO_HEX.get(input);
  if (mapped) return mapped;
  // Else treat as raw color (#hex / rgb(...) / token).
  return input;
}
