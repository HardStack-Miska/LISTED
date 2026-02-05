import React, { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { BlockEditor, PageHeader } from "@/components/editor";
import { COLORS } from "@/constants";
import type { EditorBlock } from "@/types/editor";

export default function NewNoteScreen() {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📝");

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleIconPress = useCallback(() => {
    const icons = ["📝", "📚", "💡", "🎯", "✅", "🔥", "⭐", "📌"];
    const currentIndex = icons.indexOf(icon);
    const nextIndex = (currentIndex + 1) % icons.length;
    setIcon(icons[nextIndex] ?? "📝");
  }, [icon]);

  const handleBlocksChange = useCallback((blocks: EditorBlock[]) => {
    // TODO: Автосохранение новой заметки
    console.log("New note blocks:", blocks.length);
  }, []);

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
});
