export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'letget:theme';
export const THEME_CHANGE_EVENT = 'letget:theme-change';

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  // CSS only knows light + dark. Resolve `system` to whichever matches OS now.
  const resolved = theme === 'system' ? resolveSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.dataset.themePref = theme;
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

// Listen for OS theme changes when user's preference is `system`.
// Call once at app boot from a client component.
export function startSystemThemeListener() {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    const pref = (localStorage.getItem(THEME_STORAGE_KEY) ?? 'system') as Theme;
    if (pref === 'system') applyTheme('system');
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
