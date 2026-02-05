import React, { useMemo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import type { NoteListItem } from "@/types/notes";

interface NoteCardProps {
  note: NoteListItem;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = React.memo(
  ({ note, onPress, onLongPress }) => {
    const formattedDate = useMemo(
      () => formatRelativeDate(note.updatedAt),
      [note.updatedAt],
    );

    const handlePress = useCallback(() => onPress(note.id), [onPress, note.id]);
    const handleLongPress = useCallback(
      () => onLongPress?.(note.id),
      [onLongPress, note.id],
    );

    return (
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            {note.icon && <Text style={styles.icon}>{note.icon}</Text>}
            <Text style={styles.title} numberOfLines={1}>
              {note.title || "Без названия"}
            </Text>
          </View>
          {note.preview && (
            <Text style={styles.preview} numberOfLines={2}>
              {note.preview}
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.date}>{formattedDate}</Text>
            {note.hasChildren && (
              <Text style={styles.childrenIndicator}>📄</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  },
);

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  preview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  childrenIndicator: {
    fontSize: FONT_SIZES.xs,
  },
});
