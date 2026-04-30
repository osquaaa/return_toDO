# Design Polish + PWA Implementation Plan

> Concise. Builds: PWA manifest + service worker, dark/light theme toggle wired to user_preferences, mobile drawer for sidebar, motion polish via prefers-reduced-motion, basic icon set.

**Goal:** Make the app installable, themeable, mobile-friendly, and delightful.

---

## Task 1: PWA manifest + icons

**Files:**

- Create: `apps/web/public/manifest.webmanifest`
- Create: `apps/web/public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (placeholder solid-color PNGs with brand gradient — generate via Node script if no design assets, or use simple SVG-to-PNG)
- Modify: `apps/web/src/app/layout.tsx` — add `<link rel="manifest">` + theme-color meta + apple-touch-icon

```json
// manifest.webmanifest
{
  "name": "LETget",
  "short_name": "LETget",
  "description": "Списки и заметки на каждый день",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fcf8f1",
  "theme_color": "#1a1410",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Skip icon generation in this task — write placeholder PNGs (or SVG with `.png` extension if browsers complain, swap later for designed ones). Document in README that real icons need to be designed.

Commit: `web/pwa: manifest + meta tags`

---

## Task 2: Service worker (simple offline shell)

**Files:**

- Create: `apps/web/public/sw.js` — Workbox-free, hand-rolled simple SW: cache shell + offline page
- Create: `apps/web/public/offline.html` — minimal "Offline. Reconnect to continue."
- Create: `apps/web/src/components/pwa/sw-register.tsx` — `'use client'` component that registers SW on mount
- Modify: `apps/web/src/app/layout.tsx` — mount `<SwRegister />`

`sw.js`:

```js
const CACHE = 'letget-shell-v1';
const SHELL = ['/', '/offline.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Network-first for HTML; fall back to cached shell or offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r ?? caches.match('/offline.html')),
      ),
    );
  }
});
```

`SwRegister`:

```tsx
'use client';
import { useEffect } from 'react';
export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
```

Commit: `web/pwa: service worker + offline page`

---

## Task 3: Theme switcher

**Files:**

- Create: `apps/web/src/components/pwa/theme-switcher.tsx` — client component with 3-state toggle (light/dark/system)
- Create: `apps/web/src/lib/theme.ts` — `applyTheme(theme)` writes to `<html data-theme=...>` and updates user pref via API
- Create: `apps/web/src/app/api/preferences/theme/route.ts` — POST { theme } updates user_preferences
- Modify: `apps/web/src/app/globals.css` — make dark vars active via `[data-theme="dark"]` selector instead of `prefers-color-scheme`
- Modify: `apps/web/src/app/(modules)/settings/page.tsx` — add ThemeSwitcher card
- Modify: `apps/web/src/app/layout.tsx` — early-script that reads `localStorage.getItem('theme')` or system preference and sets `data-theme` before paint (to prevent FOUC)

Commit: `web/theme: light/dark/system switcher with preference persist`

---

## Task 4: Mobile drawer for sidebar

**Files:**

- Modify: `apps/web/src/components/layout/Sidebar.tsx` — convert to also render as drawer on mobile (sheet that slides from left)
- Modify: `apps/web/src/components/layout/Topbar.tsx` — add hamburger button on mobile that opens the drawer
- Create: `apps/web/src/components/layout/mobile-drawer.tsx` — `'use client'`, holds drawer open state, listens for Escape

Behavior:

- ≥1024px: sidebar always visible (current behavior)
- <1024px: sidebar hidden; hamburger in topbar opens drawer overlay
- Drawer closes on link click, Escape key, or overlay click

Commit: `web/layout: mobile drawer for sidebar`

---

## Task 5: Motion polish + reduced-motion

**Files:**

- Modify: `apps/web/src/app/globals.css` — add `--motion-fast: 120ms`, `--motion-base: 220ms`, `--motion-slow: 360ms`, `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` tokens. Wrap all transition rules in `@media (prefers-reduced-motion: no-preference) { ... }` so reduced-motion users get no transitions.
- Touch up specific components: task-item hover lift (`translate-y` -1px), button press scale (0.98), modal fade-in.

Commit: `web/motion: tokens + reduced-motion respect`

---

## Task 6: Final polish + verify

- Lighthouse: hand-test on built dev server. Target ≥85 perf, ≥95 a11y.
- Run `pnpm -r typecheck` + `pnpm -r test`.

Tag: `git tag plan7-complete -m "Plan 7 done: design polish + pwa"`.
