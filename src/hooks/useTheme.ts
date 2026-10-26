import { useEffect } from 'react';
import type { ThemePreference } from '../domain/types';

const THEME_COLORS = { light: '#ffffff', dark: '#1b1d21' } as const;
const DARK_QUERY = '(prefers-color-scheme: dark)';

function applyTheme(preference: ThemePreference): void {
  const resolved = preference === 'system' ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

export function useTheme(preference: ThemePreference): void {
  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system') return undefined;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);
}
