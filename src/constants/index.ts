// Константы приложения LISTED

export const APP_NAME = "LISTED";

export const BLOCK_TYPES = {
  PARAGRAPH: "paragraph",
  HEADING1: "heading1",
  HEADING2: "heading2",
  HEADING3: "heading3",
  BULLET_LIST: "bulletList",
  NUMBERED_LIST: "numberedList",
  CHECKBOX: "checkbox",
  TASK: "task",
  CODE: "code",
  IMAGE: "image",
  PAGE_LINK: "pageLink",
} as const;

export const DEFAULT_BLOCK_TYPE = BLOCK_TYPES.PARAGRAPH;

export const DATABASE = {
  NAME: "listed_db",
  VERSION: 1,
} as const;

// Todoist-style colors
export const COLORS_LIGHT = {
  primary: "#dc4c3e", // Todoist red
  primaryLight: "#fce4e2", // Light red for backgrounds
  secondary: "#808080",
  background: "#ffffff",
  surface: "#fafafa",
  text: "#202020",
  textSecondary: "#808080",
  border: "#f0f0f0",
  error: "#dc4c3e",
  danger: "#f44336",
  success: "#058527",
  warning: "#ff9900",
  white: "#ffffff",
  // Priority colors
  priorityP1: "#d1453b",
  priorityP2: "#eb8909",
  priorityP3: "#246fe0",
  priorityP4: "#808080",
} as const;

export const COLORS_DARK = {
  primary: "#dc4c3e",
  primaryLight: "#3d2222", // Dark red for backgrounds
  secondary: "#a0a0a0",
  background: "#1f1f1f",
  surface: "#282828",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  border: "#333333",
  error: "#dc4c3e",
  danger: "#f44336",
  success: "#058527",
  warning: "#ff9900",
  white: "#ffffff",
  // Priority colors (same in dark)
  priorityP1: "#d1453b",
  priorityP2: "#eb8909",
  priorityP3: "#246fe0",
  priorityP4: "#808080",
} as const;

// Default export for backward compatibility
export const COLORS = COLORS_LIGHT;

export const UI_SIZES = {
  fabSize: 56,
  fabRadius: 28,
  cardRadius: 12,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const TYPOGRAPHY = {
  fontSize: FONT_SIZES,
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
