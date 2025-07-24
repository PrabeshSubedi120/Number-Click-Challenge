import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

let globalColorScheme = Appearance.getColorScheme() || 'light';
let listeners: ((scheme: 'light' | 'dark') => void)[] = [];

export function useColorScheme() {
  const [colorScheme, setColorSchemeState] = useState(globalColorScheme);

  useEffect(() => {
    const listener = (scheme: 'light' | 'dark') => setColorSchemeState(scheme);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return colorScheme;
}

export function setColorScheme(scheme: 'light' | 'dark') {
  globalColorScheme = scheme;
  listeners.forEach(l => l(scheme));
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('colorScheme', scheme);
  }
}

// On web, try to load from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const stored = window.localStorage.getItem('colorScheme');
  if (stored === 'light' || stored === 'dark') {
    globalColorScheme = stored;
  }
}
