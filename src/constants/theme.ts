/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export interface Theme {
  readonly text: string;
  readonly background: string;
  readonly backgroundElement: string;
  readonly backgroundSelected: string;
  readonly textSecondary: string;
  readonly primary: string;
  readonly accent: string;
  readonly border: string;
  readonly cardBackground: string;
}

export type ThemeType = 'light' | 'dark' | 'midnight' | 'sunset' | 'forest';

export const Colors: Record<ThemeType, Theme> = {
  light: {
    text: '#1C1C1E',
    background: '#F8F9FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E9ECF4',
    textSecondary: '#7C8089',
    primary: '#4F46E5', // Indigo
    accent: '#06B6D4',  // Cyan
    border: '#E2E8F0',
    cardBackground: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
    primary: '#6366F1', // Indigo light
    accent: '#38BDF8',  // Sky
    border: '#334155',
    cardBackground: '#1E293B',
  },
  midnight: {
    text: '#F5F6FA',
    background: '#090A0F',
    backgroundElement: '#141724',
    backgroundSelected: '#20253B',
    textSecondary: '#8F99B5',
    primary: '#6C5CE7',
    accent: '#A29BFE',
    border: '#20253B',
    cardBackground: '#141724',
  },
  sunset: {
    text: '#FFF5F0',
    background: '#2D161A',
    backgroundElement: '#471F24',
    backgroundSelected: '#612D33',
    textSecondary: '#EBA0A6',
    primary: '#FF6B6B',
    accent: '#FFE066',
    border: '#612D33',
    cardBackground: '#471F24',
  },
  forest: {
    text: '#F4FAF6',
    background: '#0F1E16',
    backgroundElement: '#183424',
    backgroundSelected: '#254E36',
    textSecondary: '#A9DFBF',
    primary: '#2ECC71',
    accent: '#A3E4D7',
    border: '#254E36',
    cardBackground: '#183424',
  },
};

export type ThemeColor = keyof Theme;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
