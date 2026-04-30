export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('letget:theme', theme);
  } catch {}
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
