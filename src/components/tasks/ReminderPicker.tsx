import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, UI_SIZES } from '@/constants';
import { notificationService } from '@/services/notifications';

interface ReminderPickerProps {
  value: number | null; // minutes before due
  onChange: (minutes: number | null) => void;
  hasDueDate: boolean;
}

const QUICK_OPTIONS = [
  { label: 'В срок', minutes: 0, icon: 'alarm-outline' as const },
  { label: 'За 5 мин', minutes: 5, icon: 'time-outline' as const },
  { label: 'За 15 мин', minutes: 15, icon: 'time-outline' as const },
  { label: 'За 30 мин', minutes: 30, icon: 'time-outline' as const },
  { label: 'За 1 час', minutes: 60, icon: 'time-outline' as const },
  { label: 'За 1 день', minutes: 1440, icon: 'calendar-outline' as const },
];

export const ReminderPicker: React.FC<ReminderPickerProps> = ({
  value,
  onChange,
  hasDueDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = useCallback((minutes: number) => {
    onChange(minutes);
    setShowPicker(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const formatReminder = (minutes: number): string => {
    if (minutes === 0) return 'В срок';
    if (minutes < 60) return `За ${minutes} мин`;
    if (minutes < 1440) return `За ${minutes / 60} ч`;
    return `За ${minutes / 1440} дн`;
  };

  if (!hasDueDate) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Напоминание</Text>
        <Text style={styles.disabledText}>
          Установите срок выполнения
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Напоминание</Text>
        {value !== null && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      {value !== null && (
        <View style={styles.selectedReminder}>
          <Ionicons name="notifications" size={16} color={COLORS.primary} />
          <Text style={styles.selectedText}>{formatReminder(value)}</Text>
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
          name="notifications-outline"
          size={18}
          color={COLORS.textSecondary}
        />
        <Text style={styles.addButtonText}>
          {value !== null ? 'Изменить' : 'Добавить напоминание'}
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
            <Text style={styles.pickerTitle}>Напомнить</Text>
            {QUICK_OPTIONS.map((option) => (
              <Pressable
                key={option.minutes}
                style={({ pressed }) => [
                  styles.option,
                  value === option.minutes && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleSelect(option.minutes)}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={value === option.minutes ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    value === option.minutes && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {value === option.minutes && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={COLORS.primary}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.textSecondary,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  disabledText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  selectedReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  selectedText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: COLORS.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: UI_SIZES.cardRadius,
    width: 280,
    padding: SPACING.md,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  optionSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
