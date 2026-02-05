// Базовые типы для приложения LISTED

import type { Priority } from "./task";

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "checkbox"
  | "task"
  | "code"
  | "image"
  | "pageLink";

export interface BlockData {
  text?: string;
  checked?: boolean;
  language?: string;
  imageUri?: string;
  linkedPageId?: string;
  // Task block specific data
  taskId?: string;
  priority?: Priority;
  dueDate?: string;
  completed?: boolean;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
  order: number;
  pageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  parentId?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sync types для будущей синхронизации
export type SyncStatus = "synced" | "pending" | "conflict" | "error";

export interface SyncMetadata {
  status: SyncStatus;
  lastSyncedAt?: Date;
  serverVersion?: number;
  localVersion: number;
}

// Re-export task types
export * from "./task";
