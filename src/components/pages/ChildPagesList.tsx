import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { Page } from '@/types';

interface ChildPagesListProps {
  childPages: Page[];
  onPagePress: (pageId: string) => void;
  onCreateSubpage?: () => void;
}

export const ChildPagesList: React.FC<ChildPagesListProps> = React.memo(
  ({ childPages, onPagePress, onCreateSubpage }) => {
    const handlePagePress = useCallback(
      (pageId: string) => () => onPagePress(pageId),
      [onPagePress]
    );

    const renderItem: ListRenderItem<Page> = useCallback(
      ({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.pageItem,
            pressed && styles.pageItemPressed,
          ]}
          onPress={handlePagePress(item.id)}
          accessibilityLabel={`Открыть страницу ${item.title}`}
          accessibilityRole="button"
        >
          <View style={styles.pageIcon}>
            {item.icon ? (
              <Text style={styles.iconEmoji}>{item.icon}</Text>
            ) : (
              <Ionicons
                name="document-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            )}
          </View>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {item.title || 'Без названия'}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textSecondary}
          />
        </Pressable>
      ),
      [handlePagePress]
    );

    const keyExtractor = useCallback((item: Page) => item.id, []);

    const ListEmptyComponent = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="folder-open-outline"
            size={48}
            color={COLORS.border}
          />
          <Text style={styles.emptyText}>Нет вложенных страниц</Text>
        </View>
      ),
      []
    );

    const ListFooterComponent = useCallback(
      () =>
        onCreateSubpage ? (
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
            onPress={onCreateSubpage}
            accessibilityLabel="Создать подстраницу"
            accessibilityRole="button"
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.createButtonText}>Создать подстраницу</Text>
          </Pressable>
        ) : null,
      [onCreateSubpage]
    );

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Вложенные страницы</Text>
        <FlatList
          data={childPages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  pageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageItemPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.border,
  },
  pageIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  iconEmoji: {
    fontSize: FONT_SIZES.lg,
  },
  pageTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  createButtonPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.surface,
  },
  createButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
