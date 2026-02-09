import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, FONT_SIZES, UI_SIZES } from "@/constants";
import { useTheme } from "@/contexts";
import type { Colors } from "@/contexts";
import { WheelColumn } from "./WheelColumn";

interface DurationPickerProps {
  value?: number; // duration in minutes
  onChange: (duration: number | undefined) => void;
}

const QUICK_DURATIONS = [
  { label: "15 мин", value: 15 },
  { label: "30 мин", value: 30 },
  { label: "45 мин", value: 45 },
  { label: "1 час", value: 60 },
  { label: "1.5 часа", value: 90 },
  { label: "2 часа", value: 120 },
  { label: "3 часа", value: 180 },
  { label: "4 часа", value: 240 },
];

const DURATION_HOURS = Array.from({ length: 13 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const DURATION_MINUTES = ['00', '15', '30', '45'];

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${mins} мин`;
};

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customHourIndex, setCustomHourIndex] = useState(0);
  const [customMinuteIndex, setCustomMinuteIndex] = useState(0);

  const handleOpen = useCallback(() => {
    setShowCustom(false);
    setModalVisible(true);
  }, []);

  const handleQuickSelect = useCallback((duration: number) => {
    onChange(duration);
    setModalVisible(false);
  }, [onChange]);

  const handleShowCustom = useCallback(() => {
    if (value) {
      const h = Math.min(Math.floor(value / 60), 12);
      const m = value % 60;
      setCustomHourIndex(h);
      const mIdx = DURATION_MINUTES.findIndex((v) => parseInt(v, 10) >= m);
      setCustomMinuteIndex(mIdx >= 0 ? mIdx : 0);
    } else {
      setCustomHourIndex(1);
      setCustomMinuteIndex(0);
    }
    setShowCustom(true);
  }, [value]);

  const handleCustomConfirm = useCallback(() => {
    const hours = parseInt(DURATION_HOURS[customHourIndex] ?? '0', 10);
    const minutes = parseInt(DURATION_MINUTES[customMinuteIndex] ?? '0', 10);
    const total = hours * 60 + minutes;
    if (total > 0) {
      onChange(total);
    }
    setModalVisible(false);
    setShowCustom(false);
  }, [customHourIndex, customMinuteIndex, onChange]);

  const handleClear = useCallback(() => {
    onChange(undefined);
    setModalVisible(false);
  }, [onChange]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    setShowCustom(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Ionicons
            name="hourglass-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.label}>Длительность</Text>
        </View>
        <View style={styles.right}>
          {value ? (
            <>
              <Pressable onPress={handleOpen} style={styles.valueButton}>
                <Text style={styles.valueText}>{formatDuration(value)}</Text>
              </Pressable>
              <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
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
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {showCustom ? 'Своё значение' : 'Длительность'}
              </Text>
              {value && !showCustom && (
                <Pressable onPress={handleClear}>
                  <Text style={styles.clearText}>Очистить</Text>
                </Pressable>
              )}
            </View>

            {showCustom ? (
              <>
                <View style={styles.wheelsRow}>
                  <View style={styles.wheelLabel}>
                    <WheelColumn
                      items={DURATION_HOURS}
                      selectedIndex={customHourIndex}
                      onSelect={setCustomHourIndex}
                    />
                    <Text style={styles.wheelUnit}>часов</Text>
                  </View>
                  <Text style={styles.wheelSeparator}>:</Text>
                  <View style={styles.wheelLabel}>
                    <WheelColumn
                      items={DURATION_MINUTES}
                      selectedIndex={customMinuteIndex}
                      onSelect={setCustomMinuteIndex}
                    />
                    <Text style={styles.wheelUnit}>минут</Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <Pressable style={styles.cancelButton} onPress={() => setShowCustom(false)}>
                    <Text style={styles.cancelText}>Назад</Text>
                  </Pressable>
                  <Pressable style={styles.confirmButton} onPress={handleCustomConfirm}>
                    <Text style={styles.confirmText}>Готово</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.quickOptions}>
                  {QUICK_DURATIONS.map((dur) => (
                    <Pressable
                      key={dur.value}
                      style={[
                        styles.quickOption,
                        value === dur.value && styles.quickOptionSelected,
                      ]}
                      onPress={() => handleQuickSelect(dur.value)}
                    >
                      <Text
                        style={[
                          styles.quickOptionText,
                          value === dur.value && styles.quickOptionTextSelected,
                        ]}
                      >
                        {dur.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.customTrigger}>
                  <Pressable style={styles.customButton} onPress={handleShowCustom}>
                    <Ionicons name="options-outline" size={18} color={colors.primary} />
                    <Text style={styles.customButtonText}>Своё значение</Text>
                  </Pressable>
                </View>
              </>
            )}
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
    modal: {
      backgroundColor: colors.background,
      borderRadius: UI_SIZES.cardRadius,
      padding: SPACING.md,
      width: 300,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
    },
    clearText: {
      fontSize: FONT_SIZES.sm,
      color: colors.error,
    },
    quickOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    quickOption: {
      paddingHorizontal: 14,
      paddingVertical: SPACING.sm,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    quickOptionSelected: {
      backgroundColor: colors.primary,
    },
    quickOptionText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
      color: colors.text,
    },
    quickOptionTextSelected: {
      color: colors.white,
    },
    customTrigger: {
      marginTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.md,
    },
    customButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      paddingVertical: SPACING.sm,
    },
    customButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.primary,
      fontWeight: '500',
    },
    wheelsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: SPACING.sm,
    },
    wheelLabel: {
      alignItems: 'center',
    },
    wheelSeparator: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
      marginHorizontal: SPACING.sm,
    },
    wheelUnit: {
      fontSize: FONT_SIZES.xs,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    footer: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.md,
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
