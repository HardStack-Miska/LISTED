import React, { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BlockEditor, PageHeader } from "@/components/editor";
import { COLORS } from "@/constants";
import type { EditorBlock } from "@/types/editor";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState("Новая заметка");
  const [icon, setIcon] = useState("📝");

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // TODO: Сохранить в БД
  }, []);

  const handleIconPress = useCallback(() => {
    // TODO: Открыть IconPicker
    const icons = ["📝", "📚", "💡", "🎯", "✅", "🔥", "⭐", "📌"];
    const currentIndex = icons.indexOf(icon);
    const nextIndex = (currentIndex + 1) % icons.length;
    setIcon(icons[nextIndex] ?? "📝");
  }, [icon]);

  const handleBlocksChange = useCallback((blocks: EditorBlock[]) => {
    // TODO: Сохранить блоки в БД
    console.log("Blocks changed:", blocks.length);
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader
        title={title}
        icon={icon}
        onTitleChange={handleTitleChange}
        onIconPress={handleIconPress}
      />
      <BlockEditor pageId={id ?? "new"} onBlocksChange={handleBlocksChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
