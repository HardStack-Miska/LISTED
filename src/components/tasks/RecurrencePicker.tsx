import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, UI_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { RecurrenceRule, RecurrenceType } from '@/types/task';

interface RecurrencePickerProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const QUICK_OPTIONS: Array<{
  label: string;
  rule: RecurrenceRule;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    label: 'Каждый день',
    rule: { type: 'daily', interval: 1 },
    icon: 'today-outline',
  },
  {
    label: 'Каждую неделю',
    rule: { type: 'weekly', interval: 1 },
    icon: 'calendar-outline',
  },
  {
    label: 'Каждый месяц',
    rule: { type: 'monthly', interval: 1 },
    icon: 'calendar-number-outline',
  },
  {
    label: 'По будням',
    rule: { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] },
    icon: 'briefcase-outline',
  },
  {
    label: 'По выходным',
    rule: { type: 'weekly', interval: 1, daysOfWeek: [0, 6] },
    icon: 'sunny-outline',
  },
  {
    label: 'Каждый год',
    rule: { type: 'yearly', interval: 1 },
    icon: 'gift-outline',
  },
];

const formatRecurrence = (rule: RecurrenceRule): string => {
  const { type, interval, daysOfWeek } = rule;

  if (type === 'daily') {
    return interval === 1 ? 'Каждый день' : `Каждые ${interval} дн.`;
  }

  if (type === 'weekly') {
    if (daysOfWeek?.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)) {
      return 'По будням';
    }
    if (daysOfWeek?.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)) {
      return 'По выходным';
    }
    return interval === 1 ? 'Каждую неделю' : `Каждые ${interval} нед.`;
  }

  if (type === 'monthly') {
    return interval === 1 ? 'Каждый месяц' : `Каждые ${interval} мес.`;
  }

  if (type === 'yearly') {
    return interval === 1 ? 'Каждый год' : `Каждые ${interval} года`;
  }

  return 'Повтор';
};

const areRulesEqual = (a: RecurrenceRule, b: RecurrenceRule): boolean => {
  if (a.type !== b.type || a.interval !== b.interval) return false;

  const aDays = a.daysOfWeek ?? [];
  const bDays = b.daysOfWeek ?? [];

  if (aDays.length !== bDays.length) return false;
  return aDays.every((d) => bDays.includes(d));
};

export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = useCallback((rule: RecurrenceRule) => {
    onChange(rule);
    setShowPicker(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Повтор</Text>
        {value && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {value && (
        <View style={styles.selectedRecurrence}>
          <Ionicons name="repeat" size={16} color={colors.primary} />
          <Text style={styles.selectedText}>{formatRecurrence(value)}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.pressed,
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons
          name="repeat-outline"
          size={18}
          color={colors.textSecondary}
        />
        <Text style={styles.addButtonText}>
          {value ? 'Изменить' : 'Добавить повтор'}
        </Text>
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Повторять</Text>
            <ScrollView style={styles.optionsList}>
              {QUICK_OPTIONS.map((option, index) => {
                const isSelected = value && areRulesEqual(value, option.rule);
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleSelect(option.rule)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  selectedRecurrence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  selectedText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: colors.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderRadius: UI_SIZES.cardRadius,
    width: 300,
    maxHeight: 400,
    padding: SPACING.md,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
