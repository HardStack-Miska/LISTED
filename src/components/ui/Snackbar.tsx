import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

const SNACKBAR_HEIGHT = 56;
const BOTTOM_OFFSET = 80;

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 5000,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SNACKBAR_HEIGHT + BOTTOM_OFFSET)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          onDismiss();
        }, duration);
      }
    } else {
      Animated.timing(translateY, {
        toValue: SNACKBAR_HEIGHT + BOTTOM_OFFSET,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, onDismiss, translateY]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onDismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.text,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.message, { color: colors.background }]} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={handleAction}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_OFFSET,
    left: SPACING.md,
    right: SPACING.md,
    minHeight: SNACKBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '400',
  },
  actionButton: {
    marginLeft: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
