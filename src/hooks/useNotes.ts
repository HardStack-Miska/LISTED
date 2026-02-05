import { useState, useCallback, useEffect, useRef } from "react";
import { databaseService } from "@/services/database";
import type { NoteListItem, NoteSortConfig } from "@/types/notes";
import type { Page } from "@/types";

interface UseNotesResult {
  notes: NoteListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  sortConfig: NoteSortConfig;
  searchQuery: string;
  isSearching: boolean;
  refresh: () => Promise<void>;
  setSortConfig: (config: NoteSortConfig) => void;
  deleteNote: (id: string) => Promise<void>;
  createNote: (title?: string) => Promise<Page>;
  setSearchQuery: (query: string) => void;
}

const pageToNoteListItem = (page: Page): NoteListItem => ({
  id: page.id,
  title: page.title || "Без названия",
  preview: "",
  icon: page.icon,
  updatedAt: page.updatedAt,
  hasChildren: false,
});

export const useNotes = (): UseNotesResult => {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [allNotes, setAllNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState("");
  const [sortConfig, setSortConfig] = useState<NoteSortConfig>({
    field: "updatedAt",
    direction: "desc",
  });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);

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

      await databaseService.initDatabase();
      const workspaces = await databaseService.getWorkspaces();
      const ws = workspaces[0];

      if (!ws) {
        setNotes([]);
        setAllNotes([]);
        return;
      }

      setWorkspaceId(ws.id);

      const pages = await databaseService.getPages(ws.id);
      const noteItems = pages.map(pageToNoteListItem);
      const sortedNotes = sortNotes(noteItems);
      setAllNotes(sortedNotes);
      setNotes(sortedNotes);
    } catch (err) {
      setError("Не удалось загрузить заметки");
      console.error("Error loading notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sortNotes]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!workspaceId) return;

      if (!query.trim()) {
        setNotes(sortNotes(allNotes));
        setIsSearching(false);
        return;
      }

      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      searchAbortController.current = new AbortController();
      setIsSearching(true);

      try {
        const pages = await databaseService.searchPages(
          workspaceId,
          query.trim(),
        );
        const noteItems = pages.map(pageToNoteListItem);
        setNotes(sortNotes(noteItems));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error searching notes:", err);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [workspaceId, allNotes, sortNotes],
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      performSearch(query);
    },
    [performSearch],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes();
    if (searchQuery) {
      await performSearch(searchQuery);
    }
    setIsRefreshing(false);
  }, [loadNotes, searchQuery, performSearch]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await databaseService.deletePage(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setAllNotes((prev) => prev.filter((note) => note.id !== id));
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

      const newNoteItem = pageToNoteListItem(newPage);
      setNotes((prev) => [newNoteItem, ...prev]);
      setAllNotes((prev) => [newNoteItem, ...prev]);

      return newPage;
    },
    [workspaceId],
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!searchQuery) {
      setNotes(sortNotes(allNotes));
    }
  }, [sortConfig, sortNotes, allNotes, searchQuery]);

  return {
    notes,
    isLoading,
    isRefreshing,
    error,
    sortConfig,
    searchQuery,
    isSearching,
    refresh,
    setSortConfig,
    deleteNote,
    createNote,
    setSearchQuery,
  };
};
