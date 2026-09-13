const STORAGE_KEY = 'calc:theme';

export type Theme = 'light' | 'dark';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme(): Theme {
  const stored = getStoredTheme();
  const theme = stored ?? (systemPrefersDark() ? 'dark' : 'light');
  applyTheme(theme);
  return theme;
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage unavailable (private mode / disabled) — theme just won't persist.
  }
  return next;
}
