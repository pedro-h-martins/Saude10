import { useTheme as useThemeContext } from '@/context/ThemeContext';

export const useTheme = () => {
  const { theme, colors, setTheme } = useThemeContext();
  
  return {
    theme,
    colors,
    setTheme,
    isDark: theme === 'dark',
    isHighlight: theme === 'highlight',
  };
};
