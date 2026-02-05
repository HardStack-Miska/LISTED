export interface NoteListItem {
  id: string;
  title: string;
  preview: string;
  icon?: string;
  updatedAt: Date;
  hasChildren: boolean;
}

export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface NoteSortConfig {
  field: NoteSortOption;
  direction: SortDirection;
}
