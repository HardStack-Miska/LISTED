import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useNotes } from "../../hooks/useNotes";

// Мок databaseService
jest.mock("../../services/database", () => ({
  databaseService: {
    initDatabase: jest.fn(() => Promise.resolve()),
    getWorkspaces: jest.fn(() =>
      Promise.resolve([
        {
          id: "ws1",
          name: "Test Workspace",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    ),
    getPages: jest.fn(() =>
      Promise.resolve([
        {
          id: "1",
          title: "Test Note 1",
          icon: "📝",
          workspaceId: "ws1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          title: "Test Note 2",
          workspaceId: "ws1",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        },
      ]),
    ),
    deletePage: jest.fn(() => Promise.resolve()),
    createPage: jest.fn((page) =>
      Promise.resolve({
        ...page,
        id: "new-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
  },
}));

describe("useNotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    const { result } = renderHook(() => useNotes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notes).toEqual([]);
  });

  it("should load notes and set isLoading to false", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notes.length).toBe(2);
    expect(result.current.notes[0]?.title).toBe("Test Note 1");
  });

  it("should have default sort config", () => {
    const { result } = renderHook(() => useNotes());

    expect(result.current.sortConfig).toEqual({
      field: "updatedAt",
      direction: "desc",
    });
  });

  it("should update sort config", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSortConfig({ field: "title", direction: "asc" });
    });

    expect(result.current.sortConfig).toEqual({
      field: "title",
      direction: "asc",
    });
  });

  it("should delete note by id", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.notes.length;

    await act(async () => {
      await result.current.deleteNote("1");
    });

    expect(result.current.notes.length).toBe(initialLength - 1);
    expect(result.current.notes.find((n) => n.id === "1")).toBeUndefined();
  });

  it("should refresh notes", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.notes.length).toBe(2);
  });

  it("should have no error on successful load", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it("should create new note", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.notes.length;

    await act(async () => {
      await result.current.createNote("New Note");
    });

    expect(result.current.notes.length).toBe(initialLength + 1);
  });
});
