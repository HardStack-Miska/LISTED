import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { SPACING, UI_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = '+',
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: UI_SIZES.fabSize,
    height: UI_SIZES.fabSize,
    borderRadius: UI_SIZES.fabRadius,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
  },
});
