import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  statusOnline: string;
  statusOffline: string;
}

const lightColors: ThemeColors = {
  background: '#f4f4f5',
  card: '#ffffff',
  text: '#000000',
  textMuted: '#52525b',
  border: '#e4e4e7',
  primary: '#000000',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.2)',
  statusOnline: '#10b981',
  statusOffline: '#a1a1aa',
};

const darkColors: ThemeColors = {
  background: '#000000',
  card: '#09090b',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  border: '#27272a',
  primary: '#ffffff',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.2)',
  statusOnline: '#10b981',
  statusOffline: '#a1a1aa',
};

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextData>({
  theme: 'system',
  isDark: true,
  colors: darkColors,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme);
      }
    } catch (e) {
      console.warn('Failed to load theme:', e);
    } finally {
      setIsReady(true);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('@theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
