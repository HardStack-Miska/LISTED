import type { BlockType } from "./index";

export type { BlockType } from "./index";

// Курсор и выделение
export interface EditorSelection {
  blockId: string;
  start: number;
  end: number;
}

// Состояние редактора
export interface EditorState {
  pageId: string;
  focusedBlockId: string | null;
  isEditing: boolean;
  selection: EditorSelection | null;
}

// Команда редактирования (для undo/redo)
export interface EditorCommand {
  type: "insert" | "delete" | "update" | "move" | "split" | "merge";
  payload: unknown;
  timestamp: number;
}

// История команд
export interface EditorHistory {
  past: EditorCommand[];
  future: EditorCommand[];
}

// Расширенные данные блока
export interface ExtendedBlockData {
  text?: string;
  checked?: boolean;
  indent?: number;
  listNumber?: number;
  language?: string;
  linkedPageId?: string;
  linkedPageTitle?: string;
  linkedPageIcon?: string;
  imageUri?: string;
}

// Блок для редактора
export interface EditorBlock {
  id: string;
  type: BlockType;
  data: ExtendedBlockData;
  order: number;
}

// Конфигурация типа блока
export interface BlockTypeConfig {
  type: BlockType;
  label: string;
  icon: string;
  shortcut?: string;
  placeholder: string;
  hasIndent: boolean;
  category: "text" | "list" | "media" | "embed";
}

// Формат иконки страницы
export type PageIcon =
  | { type: "emoji"; value: string }
  | { type: "icon"; value: string }
  | { type: "image"; uri: string };

// Пропсы для компонентов блоков
export interface BlockComponentProps {
  block: EditorBlock;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (data: ExtendedBlockData) => void;
  onDelete: () => void;
  onEnterPress: () => void;
  onBackspaceEmpty: () => void;
}
