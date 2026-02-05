import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { BlockEditor, PageHeader } from "@/components/editor";
import { useNoteContext } from "@/contexts";
import { COLORS } from "@/constants";
import type { EditorBlock } from "@/types/editor";

export default function NewNoteScreen() {
  const router = useRouter();
  const { createNote } = useNoteContext();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📝");
  const [isCreating, setIsCreating] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // Создаем страницу при первом изменении
  const ensurePageCreated = useCallback(async () => {
    if (pageId || isCreating) return pageId;

    setIsCreating(true);
    try {
      const newPage = await createNote(title || "Новая заметка");
      setPageId(newPage.id);
      return newPage.id;
    } catch (err) {
      console.error("Error creating page:", err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [pageId, isCreating, createNote, title]);

  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);
      // Если страница уже создана, переходим на неё
      if (pageId) {
        router.replace(`/notes/${pageId}`);
      }
    },
    [pageId, router],
  );

  const handleIconPress = useCallback(() => {
    const icons = ["📝", "📚", "💡", "🎯", "✅", "🔥", "⭐", "📌", "🚀", "💻"];
    const currentIndex = icons.indexOf(icon);
    const nextIndex = (currentIndex + 1) % icons.length;
    setIcon(icons[nextIndex] ?? "📝");
  }, [icon]);

  const handleBlocksChange = useCallback(
    async (blocks: EditorBlock[]) => {
      // При первом изменении блоков создаем страницу
      const id = await ensurePageCreated();
      if (id) {
        // Переходим на страницу редактирования
        router.replace(`/notes/${id}`);
      }
    },
    [ensurePageCreated, router],
  );

  if (isCreating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title={title}
        icon={icon}
        onTitleChange={handleTitleChange}
        onIconPress={handleIconPress}
      />
      <BlockEditor pageId="new" onBlocksChange={handleBlocksChange} />
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
});
