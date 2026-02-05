import { useState, useCallback, useEffect } from 'react';
import type { NoteListItem, NoteSortConfig } from '@/types/notes';

// Моковые данные для MVP
const MOCK_NOTES: NoteListItem[] = [
  {
    id: '1',
    title: 'Добро пожаловать в LISTED',
    preview: 'Это ваша первая заметка. Нажмите, чтобы отредактировать...',
    icon: '👋',
    updatedAt: new Date(),
    hasChildren: false,
  },
  {
    id: '2',
    title: 'Идеи для проекта',
    preview: 'Список идей и планов на будущее...',
    icon: '💡',
    updatedAt: new Date(Date.now() - 86400000),
    hasChildren: true,
  },
  {
    id: '3',
    title: 'Заметки с встречи',
    preview: 'Обсудили основные пункты по проекту...',
    icon: '📝',
    updatedAt: new Date(Date.now() - 172800000),
    hasChildren: false,
  },
];

interface UseNotesResult {
  notes: NoteListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  sortConfig: NoteSortConfig;
  refresh: () => Promise<void>;
  setSortConfig: (config: NoteSortConfig) => void;
  deleteNote: (id: string) => Promise<void>;
}

export const useNotes = (): UseNotesResult => {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<NoteSortConfig>({
    field: 'updatedAt',
    direction: 'desc',
  });

  const sortNotes = useCallback(
    (notesToSort: NoteListItem[]): NoteListItem[] => {
      return [...notesToSort].sort((a, b) => {
        let comparison = 0;

        switch (sortConfig.field) {
          case 'title':
            comparison = a.title.localeCompare(b.title, 'ru');
            break;
          case 'updatedAt':
          case 'createdAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    },
    [sortConfig]
  );

  const loadNotes = useCallback(async () => {
    try {
      setError(null);
      // TODO: Заменить на реальную загрузку из SQLite
      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotes(sortNotes(MOCK_NOTES));
    } catch (err) {
      setError('Не удалось загрузить заметки');
      console.error('Error loading notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortNotes]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes();
    setIsRefreshing(false);
  }, [loadNotes]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      // TODO: Реализовать удаление из SQLite
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError('Не удалось удалить заметку');
      console.error('Error deleting note:', err);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    setNotes((prev) => sortNotes(prev));
  }, [sortConfig, sortNotes]);

  return {
    notes,
    isLoading,
    isRefreshing,
    error,
    sortConfig,
    refresh,
    setSortConfig,
    deleteNote,
  };
};
