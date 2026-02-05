import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { Page } from '@/types';

const MAX_BREADCRUMB_LEVELS = 10;
const MAX_TITLE_LENGTH = 20;

interface BreadcrumbProps {
  ancestors: Page[];
  currentTitle: string;
  onNavigate: (pageId: string) => void;
  onNavigateHome: () => void;
}

const Separator: React.FC = () => (
  <Text style={styles.separator}>/</Text>
);

export const Breadcrumb: React.FC<BreadcrumbProps> = React.memo(
  ({ ancestors, currentTitle, onNavigate, onNavigateHome }) => {
    const truncatedTitle = useMemo(() => {
      if (currentTitle.length <= MAX_TITLE_LENGTH) {
        return currentTitle;
      }
      return `${currentTitle.slice(0, MAX_TITLE_LENGTH - 3)}...`;
    }, [currentTitle]);

    const visibleAncestors = useMemo(() => {
      if (ancestors.length <= MAX_BREADCRUMB_LEVELS) {
        return ancestors;
      }
      return ancestors.slice(-MAX_BREADCRUMB_LEVELS);
    }, [ancestors]);

    const handleAncestorPress = useCallback(
      (pageId: string) => () => onNavigate(pageId),
      [onNavigate]
    );

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable
            style={({ pressed }) => [
              styles.homeButton,
              pressed && styles.pressed,
            ]}
            onPress={onNavigateHome}
            accessibilityLabel="На главную"
            accessibilityRole="button"
          >
            <Ionicons
              name="home-outline"
              size={18}
              color={COLORS.primary}
            />
          </Pressable>

          {visibleAncestors.length > 0 && <Separator />}

          {ancestors.length > MAX_BREADCRUMB_LEVELS && (
            <>
              <Text style={styles.ellipsis}>...</Text>
              <Separator />
            </>
          )}

          {visibleAncestors.map((ancestor) => (
            <React.Fragment key={ancestor.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.ancestorButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleAncestorPress(ancestor.id)}
                accessibilityLabel={`Перейти к ${ancestor.title}`}
                accessibilityRole="button"
              >
                {ancestor.icon && (
                  <Text style={styles.ancestorIcon}>{ancestor.icon}</Text>
                )}
                <Text style={styles.ancestorTitle} numberOfLines={1}>
                  {ancestor.title || 'Без названия'}
                </Text>
              </Pressable>
              <Separator />
            </React.Fragment>
          ))}

          <View style={styles.currentPage}>
            <Text style={styles.currentTitle} numberOfLines={1}>
              {truncatedTitle || 'Без названия'}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  homeButton: {
    padding: SPACING.xs,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: COLORS.surface,
  },
  separator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  ellipsis: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  ancestorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    borderRadius: 6,
    maxWidth: 150,
  },
  ancestorIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs,
  },
  ancestorTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    maxWidth: 120,
  },
  currentPage: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 180,
  },
  currentTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
});
