import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const { subscribe, set } = writable<'light' | 'dark'>(
    browser ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'light'
  );

  if (browser) {
    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      set(e.matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', e.matches);
    });
  }

  return {
    subscribe,
    toggle: () => {
      if (!browser) return;
      const current = get({ subscribe });
      const newTheme = current === 'light' ? 'dark' : 'light';
      set(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };
}

export const theme = createThemeStore(); 