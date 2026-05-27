import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeType } from '@/constants/theme';
import { loadData, saveData, STORAGE_KEYS } from '@/utils/storage';

export type UserThemeSelection = 'system' | ThemeType;

interface ThemeContextType {
  themeSelection: UserThemeSelection;
  colors: typeof Colors.light;
  setThemeSelection: (theme: UserThemeSelection) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeSelection, setThemeSelectionState] = useState<UserThemeSelection>('system');

  useEffect(() => {
    async function initTheme() {
      const savedTheme = await loadData<UserThemeSelection>(STORAGE_KEYS.ACTIVE_THEME, 'system');
      setThemeSelectionState(savedTheme);
    }
    initTheme();
  }, []);

  const setThemeSelection = async (theme: UserThemeSelection) => {
    setThemeSelectionState(theme);
    await saveData(STORAGE_KEYS.ACTIVE_THEME, theme);
  };

  // Determine active colors based on selection and system defaults
  let activeThemeKey: ThemeType = 'dark';
  if (themeSelection === 'system') {
    activeThemeKey = systemScheme === 'dark' ? 'dark' : 'light';
  } else {
    activeThemeKey = themeSelection;
  }

  const colors = Colors[activeThemeKey] || Colors.dark;

  return (
    <ThemeContext.Provider value={{ themeSelection, colors, setThemeSelection }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
