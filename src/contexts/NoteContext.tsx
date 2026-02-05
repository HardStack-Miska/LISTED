import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { databaseService } from "@/services/database";
import type { NoteListItem, NoteSortConfig } from "@/types/notes";
import type { Page } from "@/types";

interface NoteContextValue {
  notes: NoteListItem[];
  allNotes: NoteListItem[];
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
  updateNote: (id: string, updates: { title?: string; icon?: string }) => void;
  setSearchQuery: (query: string) => void;
}

const NoteContext = createContext<NoteContextValue | null>(null);

const pageToNoteListItem = (page: Page): NoteListItem => ({
  id: page.id,
  title: page.title || "Без названия",
  preview: "",
  icon: page.icon,
  updatedAt: page.updatedAt,
  hasChildren: false,
});

export const NoteProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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
      let wsId = workspaceId;

      if (!wsId) {
        await databaseService.initDatabase();
        const workspaces = await databaseService.getWorkspaces();
        const ws = workspaces[0];
        if (!ws) {
          throw new Error("No workspace found");
        }
        wsId = ws.id;
        setWorkspaceId(wsId);
      }

      const newPage = await databaseService.createPage({
        title: title || "Новая заметка",
        workspaceId: wsId,
      });

      const newNoteItem = pageToNoteListItem(newPage);
      setNotes((prev) => [newNoteItem, ...prev]);
      setAllNotes((prev) => [newNoteItem, ...prev]);

      return newPage;
    },
    [workspaceId],
  );

  const updateNote = useCallback(
    (id: string, updates: { title?: string; icon?: string }) => {
      const updateItem = (prev: NoteListItem[]): NoteListItem[] =>
        prev.map((note) =>
          note.id === id
            ? {
                ...note,
                ...(updates.title !== undefined && { title: updates.title }),
                ...(updates.icon !== undefined && { icon: updates.icon }),
                updatedAt: new Date(),
              }
            : note,
        );

      setNotes(updateItem);
      setAllNotes(updateItem);
    },
    [],
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!searchQuery) {
      setNotes(sortNotes(allNotes));
    }
  }, [sortConfig, sortNotes, allNotes, searchQuery]);

  const value = useMemo(
    () => ({
      notes,
      allNotes,
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
      updateNote,
      setSearchQuery,
    }),
    [
      notes,
      allNotes,
      isLoading,
      isRefreshing,
      error,
      sortConfig,
      searchQuery,
      isSearching,
      refresh,
      deleteNote,
      createNote,
      updateNote,
      setSearchQuery,
    ],
  );

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};

export const useNoteContext = (): NoteContextValue => {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
};
