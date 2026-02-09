import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, UI_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import { WheelColumn } from './WheelColumn';

interface TimePickerProps {
  value: string | null; // "HH:mm" format
  onChange: (time: string | null) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const MINUTES = ['00', '15', '30', '45'];

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPicker, setShowPicker] = useState(false);
  const [tempHourIndex, setTempHourIndex] = useState(0);
  const [tempMinuteIndex, setTempMinuteIndex] = useState(0);

  const handleOpen = useCallback(() => {
    if (value) {
      const parts = value.split(':');
      const h = parseInt(parts[0] ?? '0', 10);
      const m = parseInt(parts[1] ?? '0', 10);
      setTempHourIndex(h);
      // Find closest minute index
      const minuteIdx = MINUTES.findIndex((v) => parseInt(v, 10) >= m);
      setTempMinuteIndex(minuteIdx >= 0 ? minuteIdx : 0);
    } else {
      // Default to current time
      const now = new Date();
      setTempHourIndex(now.getHours());
      const mins = now.getMinutes();
      const closestIdx = MINUTES.findIndex((v) => parseInt(v, 10) >= mins);
      setTempMinuteIndex(closestIdx >= 0 ? closestIdx : 0);
    }
    setShowPicker(true);
  }, [value]);

  const handleConfirm = useCallback(() => {
    const hour = HOURS[tempHourIndex] ?? '00';
    const minute = MINUTES[tempMinuteIndex] ?? '00';
    onChange(`${hour}:${minute}`);
    setShowPicker(false);
  }, [tempHourIndex, tempMinuteIndex, onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleCancel = useCallback(() => {
    setShowPicker(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.label}>Время</Text>
        </View>
        <View style={styles.right}>
          {value ? (
            <>
              <Pressable onPress={handleOpen} style={styles.valueButton}>
                <Text style={styles.valueText}>{value}</Text>
              </Pressable>
              <Pressable onPress={handleClear} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleOpen}
              style={({ pressed }) => [
                styles.setButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.setButtonText}>Установить</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <Pressable style={styles.pickerContainer} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Выберите время</Text>

            <View style={styles.wheelsRow}>
              <WheelColumn
                items={HOURS}
                selectedIndex={tempHourIndex}
                onSelect={setTempHourIndex}
              />
              <Text style={styles.separator}>:</Text>
              <WheelColumn
                items={MINUTES}
                selectedIndex={tempMinuteIndex}
                onSelect={setTempMinuteIndex}
              />
            </View>

            <View style={styles.pickerFooter}>
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Готово</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      marginTop: SPACING.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    label: {
      fontSize: FONT_SIZES.md,
      color: colors.text,
    },
    valueButton: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: 8,
    },
    valueText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.primary,
    },
    setButton: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    setButtonText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    pressed: {
      opacity: 0.7,
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
      padding: SPACING.md,
      width: 240,
      alignItems: 'center',
    },
    pickerTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    wheelsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    separator: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
      marginHorizontal: SPACING.sm,
    },
    pickerFooter: {
      flexDirection: 'row',
      marginTop: SPACING.md,
      gap: SPACING.sm,
      width: '100%',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    confirmText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.white,
    },
  });
