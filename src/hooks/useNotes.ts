import { useState, useCallback, useEffect } from "react";
import { databaseService } from "@/services/database";
import type { NoteListItem, NoteSortConfig } from "@/types/notes";
import type { Page } from "@/types";

interface UseNotesResult {
  notes: NoteListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  sortConfig: NoteSortConfig;
  refresh: () => Promise<void>;
  setSortConfig: (config: NoteSortConfig) => void;
  deleteNote: (id: string) => Promise<void>;
  createNote: (title?: string) => Promise<Page>;
}

const pageToNoteListItem = (page: Page): NoteListItem => ({
  id: page.id,
  title: page.title || "Без названия",
  preview: "", // TODO: загружать первый блок как preview
  icon: page.icon,
  updatedAt: page.updatedAt,
  hasChildren: false, // TODO: проверять наличие дочерних страниц
});

export const useNotes = (): UseNotesResult => {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<NoteSortConfig>({
    field: "updatedAt",
    direction: "desc",
  });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const sortNotes = useCallback(
    (notesToSort: NoteListItem[]): NoteListItem[] => {
      return [...notesToSort].sort((a, b) => {
        let comparison = 0;

        switch (sortConfig.field) {
          case "title":
            comparison = a.title.localeCompare(b.title, "ru");
            break;
          case "updatedAt":
          case "createdAt":
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
        }

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    },
    [sortConfig],
  );

  const loadNotes = useCallback(async () => {
    try {
      setError(null);

      // Инициализируем БД и получаем workspace
      await databaseService.initDatabase();
      const workspaces = await databaseService.getWorkspaces();
      const ws = workspaces[0];

      if (!ws) {
        setNotes([]);
        return;
      }

      setWorkspaceId(ws.id);

      // Загружаем страницы
      const pages = await databaseService.getPages(ws.id);
      const noteItems = pages.map(pageToNoteListItem);
      setNotes(sortNotes(noteItems));
    } catch (err) {
      setError("Не удалось загрузить заметки");
      console.error("Error loading notes:", err);
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
      await databaseService.deletePage(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError("Не удалось удалить заметку");
      console.error("Error deleting note:", err);
    }
  }, []);

  const createNote = useCallback(
    async (title?: string): Promise<Page> => {
      if (!workspaceId) {
        throw new Error("Workspace not initialized");
      }

      const newPage = await databaseService.createPage({
        title: title || "Новая заметка",
        workspaceId,
      });

      // Добавляем в список
      setNotes((prev) => [pageToNoteListItem(newPage), ...prev]);

      return newPage;
    },
    [workspaceId],
  );

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
    createNote,
  };
};
