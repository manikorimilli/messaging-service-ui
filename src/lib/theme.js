import { useSyncExternalStore } from 'react';

// Light / dark / system theme. The choice is a per-browser convenience kept in
// localStorage; "system" (the default) follows the operating system setting.
const KEY = 'theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

export function getPreference() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

function resolve(preference) {
  if (preference === 'system') return media.matches ? 'dark' : 'light';
  return preference;
}

export function applyTheme() {
  document.documentElement.classList.toggle('dark', resolve(getPreference()) === 'dark');
}

export function setPreference(preference) {
  try {
    if (preference === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // Storage blocked (private mode): the choice still applies for this page view.
  }
  applyTheme();
  window.dispatchEvent(new Event('themechange'));
}

function subscribe(callback) {
  const onSystemChange = () => {
    applyTheme();
    callback();
  };
  window.addEventListener('themechange', callback);
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener('themechange', callback);
    media.removeEventListener('change', onSystemChange);
  };
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getPreference);
  const resolved = useSyncExternalStore(subscribe, () => resolve(getPreference()));
  return { preference, resolved, setPreference };
}
