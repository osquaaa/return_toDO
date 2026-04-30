'use client';

import { useEffect } from 'react';

import { startSystemThemeListener } from '@/lib/theme';

export function SystemThemeWatcher() {
  useEffect(() => startSystemThemeListener(), []);
  return null;
}
