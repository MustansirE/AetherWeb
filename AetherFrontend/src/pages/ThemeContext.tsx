import React, { createContext, useState, useContext, useEffect } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user has a saved preference or use dark as default
  const getSavedTheme = (): ThemeType => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    return (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) 
      ? savedTheme 
      : 'dark'; // Default to dark theme
  };

  const [theme, setTheme] = useState<ThemeType>(getSavedTheme());

  // Apply theme variables when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Apply CSS variables based on theme
    if (theme === 'dark') {
      // Dark theme colors from HomeScreen
      document.documentElement.style.setProperty('--bg-primary', '#212121');
      document.documentElement.style.setProperty('--bg-secondary', 'rgba(60, 60, 60, 0.8)');
      document.documentElement.style.setProperty('--bg-tertiary', 'rgba(60, 60, 60, 0.8)');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#e0e0e0');
      document.documentElement.style.setProperty('--text-muted', '#AAAAAA');
      document.documentElement.style.setProperty('--border-color', '#333333');
      document.documentElement.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.1)');
      document.documentElement.style.setProperty('--accent-color', '#EAAC82');
      document.documentElement.style.setProperty('--secondary-accent', '#8DA08E');
      document.documentElement.style.setProperty('--danger-color', '#885A5A');
      document.documentElement.style.setProperty('--glass-bg', 'rgba(60, 60, 60, 0.8)');
      document.documentElement.style.setProperty('--danger-bg', 'rgba(255, 82, 82, 0.1)');
      document.documentElement.style.setProperty('--danger-text', '#FF6B6B');
      
      // Directly apply background color to body
      document.body.style.backgroundColor = '#212121';
      document.body.style.color = '#ffffff';
    } else {
      // Light theme colors from HomeScreen
      document.documentElement.style.setProperty('--bg-primary', '#FFF7F2');
      document.documentElement.style.setProperty('--bg-secondary', 'rgba(235, 223, 211, 0.8)');
      document.documentElement.style.setProperty('--bg-tertiary', 'rgba(235, 223, 211, 0.8)');
      document.documentElement.style.setProperty('--text-primary', '#000000');
      document.documentElement.style.setProperty('--text-secondary', '#333333');
      document.documentElement.style.setProperty('--text-muted', '#666666');
      document.documentElement.style.setProperty('--border-color', '#d8d8d8');
      document.documentElement.style.setProperty('--input-bg', 'rgba(0, 0, 0, 0.1)');
      document.documentElement.style.setProperty('--accent-color', '#EAAC82');
      document.documentElement.style.setProperty('--secondary-accent', '#8DA08E');
      document.documentElement.style.setProperty('--danger-color', '#885A5A');
      document.documentElement.style.setProperty('--glass-bg', 'rgba(235, 223, 211, 0.8)');
      document.documentElement.style.setProperty('--danger-bg', 'rgba(255, 82, 82, 0.1)');
      document.documentElement.style.setProperty('--danger-text', '#FF6B6B');
      
      // Directly apply background color to body
      document.body.style.backgroundColor = '#FFF7F2';
      document.body.style.color = '#000000';
    }

    // Add a class to the body for additional styling hooks
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};