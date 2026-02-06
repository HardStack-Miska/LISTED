import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import { Priority, PRIORITY_COLORS } from '@/types/task';

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

interface PriorityOption {
  priority: Priority;
  label: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  { priority: 1, label: 'P1' },
  { priority: 2, label: 'P2' },
  { priority: 3, label: 'P3' },
  { priority: 4, label: 'P4' },
];

export const PriorityPicker: React.FC<PriorityPickerProps> = ({
  value,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Приоритет</Text>
      <View style={styles.options}>
        {PRIORITY_OPTIONS.map((option) => {
          const isSelected = value === option.priority;
          const color = PRIORITY_COLORS[option.priority];

          return (
            <Pressable
              key={option.priority}
              style={({ pressed }) => [
                styles.option,
                isSelected && { backgroundColor: `${color}15` },
                pressed && styles.pressed,
              ]}
              onPress={() => onChange(option.priority)}
            >
              <Ionicons
                name={isSelected ? 'flag' : 'flag-outline'}
                size={20}
                color={color}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && { color, fontWeight: '600' },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  options: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  optionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
