import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeConfig } from '../types';
import { themeConfig } from '../theme';

interface ThemeContextType {
  theme: ThemeConfig;
  themeName: string;
  setThemeName: (name: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children, initialTheme = 'emerald' }: { children: ReactNode, initialTheme?: string }) => {
  const [themeName, setThemeName] = React.useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme || initialTheme;
  });

  React.useEffect(() => {
    localStorage.setItem('app-theme', themeName);
  }, [themeName]);

  const theme = themeConfig[themeName as keyof typeof themeConfig] || themeConfig.emerald;

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
