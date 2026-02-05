import { BLOCK_TYPES } from "./index";
import type { BlockTypeConfig, BlockType } from "@/types/editor";

export const BLOCK_TYPE_CONFIGS: BlockTypeConfig[] = [
  {
    type: BLOCK_TYPES.PARAGRAPH,
    label: "Текст",
    icon: "text",
    placeholder: "Введите текст...",
    hasIndent: false,
    category: "text",
  },
  {
    type: BLOCK_TYPES.HEADING1,
    label: "Заголовок 1",
    icon: "heading",
    shortcut: "# ",
    placeholder: "Заголовок 1",
    hasIndent: false,
    category: "text",
  },
  {
    type: BLOCK_TYPES.HEADING2,
    label: "Заголовок 2",
    icon: "heading",
    shortcut: "## ",
    placeholder: "Заголовок 2",
    hasIndent: false,
    category: "text",
  },
  {
    type: BLOCK_TYPES.HEADING3,
    label: "Заголовок 3",
    icon: "heading",
    shortcut: "### ",
    placeholder: "Заголовок 3",
    hasIndent: false,
    category: "text",
  },
  {
    type: BLOCK_TYPES.BULLET_LIST,
    label: "Маркированный список",
    icon: "list",
    shortcut: "- ",
    placeholder: "Элемент списка",
    hasIndent: true,
    category: "list",
  },
  {
    type: BLOCK_TYPES.NUMBERED_LIST,
    label: "Нумерованный список",
    icon: "list-ol",
    shortcut: "1. ",
    placeholder: "Элемент списка",
    hasIndent: true,
    category: "list",
  },
  {
    type: BLOCK_TYPES.CHECKBOX,
    label: "Чекбокс",
    icon: "check-square",
    shortcut: "[] ",
    placeholder: "Задача",
    hasIndent: true,
    category: "list",
  },
  {
    type: BLOCK_TYPES.CODE,
    label: "Код",
    icon: "code",
    shortcut: "``` ",
    placeholder: "Код",
    hasIndent: false,
    category: "text",
  },
  {
    type: BLOCK_TYPES.IMAGE,
    label: "Изображение",
    icon: "image",
    placeholder: "",
    hasIndent: false,
    category: "media",
  },
  {
    type: BLOCK_TYPES.PAGE_LINK,
    label: "Ссылка на страницу",
    icon: "file-text",
    placeholder: "",
    hasIndent: false,
    category: "embed",
  },
];

export const getBlockTypeConfig = (
  type: string,
): BlockTypeConfig | undefined => {
  return BLOCK_TYPE_CONFIGS.find((config) => config.type === type);
};

export const MARKDOWN_SHORTCUTS: Record<string, BlockType> = {
  "# ": BLOCK_TYPES.HEADING1 as BlockType,
  "## ": BLOCK_TYPES.HEADING2 as BlockType,
  "### ": BLOCK_TYPES.HEADING3 as BlockType,
  "- ": BLOCK_TYPES.BULLET_LIST as BlockType,
  "* ": BLOCK_TYPES.BULLET_LIST as BlockType,
  "1. ": BLOCK_TYPES.NUMBERED_LIST as BlockType,
  "[] ": BLOCK_TYPES.CHECKBOX as BlockType,
  "[ ] ": BLOCK_TYPES.CHECKBOX as BlockType,
  "```": BLOCK_TYPES.CODE as BlockType,
};
