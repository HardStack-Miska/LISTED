import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useNotes } from "../../hooks/useNotes";

describe("useNotes", () => {
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

    expect(result.current.notes.length).toBeGreaterThan(0);
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
    const noteToDelete = result.current.notes[0];

    await act(async () => {
      await result.current.deleteNote(noteToDelete?.id ?? "");
    });

    expect(result.current.notes.length).toBe(initialLength - 1);
    expect(
      result.current.notes.find((n) => n.id === noteToDelete?.id),
    ).toBeUndefined();
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
    expect(result.current.notes.length).toBeGreaterThan(0);
  });

  it("should have no error on successful load", async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });
});
