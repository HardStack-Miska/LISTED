import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useColorScheme, ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS_LIGHT, COLORS_DARK } from "@/constants";

type ThemeMode = "light" | "dark" | "system";

export type Colors = typeof COLORS_LIGHT | typeof COLORS_DARK;

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "@listed_theme_mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch {
        // Theme loading failed, using default
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch {
      // Theme saving failed silently
    }
  }, []);

  // Determine if dark mode is active
  const isDark =
    mode === "dark" || (mode === "system" && systemColorScheme === "dark");

  // Get current colors
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

  // Show minimal loading indicator until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Hook to get just the colors (convenience)
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};
