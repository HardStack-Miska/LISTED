// Константы приложения LISTED

export const APP_NAME = 'LISTED';

export const BLOCK_TYPES = {
  PARAGRAPH: 'paragraph',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  HEADING3: 'heading3',
  BULLET_LIST: 'bulletList',
  NUMBERED_LIST: 'numberedList',
  CHECKBOX: 'checkbox',
  CODE: 'code',
  IMAGE: 'image',
  PAGE_LINK: 'pageLink',
} as const;

export const DEFAULT_BLOCK_TYPE = BLOCK_TYPES.PARAGRAPH;

export const DATABASE = {
  NAME: 'listed_db',
  VERSION: 1,
} as const;

export const COLORS = {
  primary: '#2F80ED',
  secondary: '#6B7280',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
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
