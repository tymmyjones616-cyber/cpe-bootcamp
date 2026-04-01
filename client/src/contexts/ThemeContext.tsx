import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  themeConfig: Record<string, string> | null;
  updateThemeLocally: (config: Record<string, string>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [localThemeConfig, setLocalThemeConfig] = useState<Record<string, string> | null>(null);

  // Fetch settings from CMS
  const { data: settings } = trpc.cms.getSettings.useQuery();

  useEffect(() => {
    const root = document.documentElement;
    
    // Light/Dark mode class
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
    
    // Apply dynamic theme from DB or local preview
    const configToApply = localThemeConfig || settings?.themeConfig as Record<string, string> | null;
    
    if (configToApply) {
      Object.entries(configToApply).forEach(([key, value]) => {
        if (value) {
          // Key mapping: convert camelCase to kebab-case if needed, but we assume they match CSS var names
          // e.g. primary -> --primary
          const varName = key.startsWith('--') ? key : `--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
          root.style.setProperty(varName, value);
        }
      });
    }
  }, [theme, switchable, settings, localThemeConfig]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const updateThemeLocally = (config: Record<string, string>) => {
    setLocalThemeConfig(config);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      switchable, 
      themeConfig: (localThemeConfig || settings?.themeConfig || null) as Record<string, string> | null,
      updateThemeLocally 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
