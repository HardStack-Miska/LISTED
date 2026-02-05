import React, { useCallback, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { NoteList } from "@/components/ui/NoteList";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useNoteContext } from "@/contexts";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import type { NoteListItem } from "@/types/notes";

interface DeleteDialogState {
  visible: boolean;
  note: NoteListItem | null;
}

export default function NotesScreen() {
  const router = useRouter();
  const {
    notes,
    isLoading,
    isRefreshing,
    refresh,
    deleteNote,
    searchQuery,
    setSearchQuery,
    isSearching,
  } = useNoteContext();

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    visible: false,
    note: null,
  });

  const handleNotePress = useCallback(
    (id: string) => {
      router.push(`/notes/${id}`);
    },
    [router],
  );

  const handleNoteLongPress = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;

      setDeleteDialog({
        visible: true,
        note,
      });
    },
    [notes],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteDialog.note) {
      await deleteNote(deleteDialog.note.id);
    }
    setDeleteDialog({ visible: false, note: null });
  }, [deleteDialog.note, deleteNote]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ visible: false, note: null });
  }, []);

  const handleCreateNote = useCallback(() => {
    router.push("/notes/new");
  }, [router]);

  const showEmptySearchResults =
    !isLoading && !isSearching && searchQuery.trim() && notes.length === 0;

  const noteTitle = deleteDialog.note?.title || "Без названия";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Заметки</Text>
        <Text style={styles.headerCount}>{notes.length} заметок</Text>
      </View>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Поиск заметок..."
      />
      {showEmptySearchResults ? (
        <View style={styles.emptySearchContainer}>
          <Text style={styles.emptySearchTitle}>Ничего не найдено</Text>
          <Text style={styles.emptySearchDescription}>
            По запросу "{searchQuery}" заметок не найдено
          </Text>
        </View>
      ) : (
        <NoteList
          notes={notes}
          isLoading={isLoading || isSearching}
          isRefreshing={isRefreshing}
          onNotePress={handleNotePress}
          onNoteLongPress={handleNoteLongPress}
          onRefresh={refresh}
          onCreateNote={handleCreateNote}
        />
      )}
      <FloatingActionButton onPress={handleCreateNote} />
      <ConfirmDialog
        visible={deleteDialog.visible}
        title={`Удалить "${noteTitle}"?`}
        message="Эта заметка будет удалена безвозвратно. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        confirmStyle="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptySearchTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySearchDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
