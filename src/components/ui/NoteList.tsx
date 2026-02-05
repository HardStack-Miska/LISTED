import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { NoteCard } from './NoteCard';
import { EmptyState } from './EmptyState';
import { COLORS, SPACING } from '@/constants';
import type { NoteListItem } from '@/types/notes';

interface NoteListProps {
  notes: NoteListItem[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onNotePress: (id: string) => void;
  onNoteLongPress?: (id: string) => void;
  onRefresh?: () => void;
  onCreateNote?: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  isLoading,
  isRefreshing = false,
  onNotePress,
  onNoteLongPress,
  onRefresh,
  onCreateNote,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: NoteListItem }) => (
      <NoteCard
        note={item}
        onPress={onNotePress}
        onLongPress={onNoteLongPress}
      />
    ),
    [onNotePress, onNoteLongPress]
  );

  const keyExtractor = useCallback((item: NoteListItem) => item.id, []);

  if (isLoading && notes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="Нет заметок"
        description="Создайте первую заметку, чтобы начать"
        actionLabel="Создать заметку"
        onAction={onCreateNote}
      />
    );
  }

  return (
    <FlatList
      data={notes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
});
