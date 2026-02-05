import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BlockEditor, PageHeader } from "@/components/editor";
import { usePageData } from "@/hooks/usePageData";
import { useAutoSave } from "@/hooks/useAutoSave";
import { COLORS, SPACING } from "@/constants";
import type { EditorBlock } from "@/types/editor";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    page,
    blocks: initialBlocks,
    isLoading,
    error,
    updateTitle,
    updateIcon,
    saveBlocks,
  } = usePageData(id);

  const [localBlocks, setLocalBlocks] = useState<EditorBlock[]>([]);

  // Синхронизируем локальные блоки с загруженными
  useEffect(() => {
    if (initialBlocks.length > 0) {
      setLocalBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  // Автосохранение блоков
  const { isSaving } = useAutoSave(localBlocks, saveBlocks, {
    debounceMs: 1000,
    enabled: !!id && id !== "new" && localBlocks.length > 0,
  });

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      updateTitle(newTitle);
    },
    [updateTitle],
  );

  const handleIconPress = useCallback(() => {
    const icons = ["📝", "📚", "💡", "🎯", "✅", "🔥", "⭐", "📌", "🚀", "💻"];
    const currentIcon = page?.icon || "📝";
    const currentIndex = icons.indexOf(currentIcon);
    const nextIndex = (currentIndex + 1) % icons.length;
    updateIcon(icons[nextIndex] ?? "📝");
  }, [page?.icon, updateIcon]);

  const handleBlocksChange = useCallback((blocks: EditorBlock[]) => {
    setLocalBlocks(blocks);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title={page?.title || "Новая заметка"}
        icon={page?.icon || "📝"}
        onTitleChange={handleTitleChange}
        onIconPress={handleIconPress}
      />
      {isSaving && (
        <View style={styles.savingIndicator}>
          <Text style={styles.savingText}>Сохранение...</Text>
        </View>
      )}
      <BlockEditor
        pageId={id ?? "new"}
        initialBlocks={localBlocks}
        onBlocksChange={handleBlocksChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: "center",
  },
  savingIndicator: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    zIndex: 10,
  },
  savingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
