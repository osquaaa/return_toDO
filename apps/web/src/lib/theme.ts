export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'letget:theme';
export const THEME_CHANGE_EVENT = 'letget:theme-change';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
  }
}

export async function persistTheme(theme: Theme) {
  applyTheme(theme);
  try {
    await fetch('/api/preferences/theme', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
  } catch {}
}
