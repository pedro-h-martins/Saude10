import { ThemeColors, ThemeMode, defaultThemeName, isThemeDark, themes } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_PREFERENCE_KEY = 'saude10_theme_preference';

interface ThemeContextValue {
  colors: ThemeColors;
  themeName: string;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveThemeName(mode: ThemeMode, systemScheme: string | null): string {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'interstellar-deep';
  if (mode === 'system') {
    return systemScheme === 'dark' ? 'interstellar-deep' : 'light';
  }
  return defaultThemeName;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { mode: ThemeMode };
          setModeState(parsed.mode);
        }
      } catch {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (m: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, JSON.stringify({ mode: m }));
    } catch {
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    persist(newMode);
  };

  const themeName = resolveThemeName(mode, systemColorScheme as string | null);
  const colors = themes[themeName] ?? themes[defaultThemeName];
  const isDark = isThemeDark(themeName);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, themeName, mode, isDark, setMode }),
    [colors, themeName, mode, isDark],
  );

  if (!loaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
