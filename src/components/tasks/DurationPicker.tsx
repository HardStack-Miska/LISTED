import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

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

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

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

  const handleQuickSelect = (duration: number) => {
    onChange(duration);
    setModalVisible(false);
  };

  const handleCustomDuration = () => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      onChange(totalMinutes);
    }
    setCustomHours("");
    setCustomMinutes("");
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: value ? colors.primaryLight : colors.surface,
            borderColor: value ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="time-outline"
          size={18}
          color={value ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[
            styles.buttonText,
            { color: value ? colors.primary : colors.textSecondary },
          ]}
        >
          {value ? formatDuration(value) : "Длительность"}
        </Text>
        {value && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modal, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                Выберите длительность
              </Text>
              {value && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={[styles.clearText, { color: colors.danger }]}>
                    Очистить
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.quickOptions}>
              {QUICK_DURATIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.quickOption,
                    {
                      backgroundColor:
                        value === duration.value
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => handleQuickSelect(duration.value)}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      {
                        color:
                          value === duration.value ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[styles.customSection, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.customLabel, { color: colors.text }]}>
                Своё значение
              </Text>
              <View style={styles.customInputs}>
                <View style={styles.customInputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={customHours}
                    onChangeText={setCustomHours}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={2}
                  />
                  <Text
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    часов
                  </Text>
                </View>
                <View style={styles.customInputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={2}
                  />
                  <Text
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    минут
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleCustomDuration}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 14,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  quickOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  customSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  customInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customInputGroup: {
    alignItems: "center",
  },
  customInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  applyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
});
