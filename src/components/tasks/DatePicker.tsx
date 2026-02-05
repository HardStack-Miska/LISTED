import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, UI_SIZES } from "@/constants";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

interface QuickDateOption {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  getDate: () => Date;
}

const QUICK_OPTIONS: QuickDateOption[] = [
  {
    key: "today",
    label: "Сегодня",
    icon: "today-outline",
    getDate: () => new Date(),
  },
  {
    key: "tomorrow",
    label: "Завтра",
    icon: "sunny-outline",
    getDate: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    },
  },
  {
    key: "nextWeek",
    label: "След. неделя",
    icon: "calendar-outline",
    getDate: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    },
  },
];

const formatDate = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Сегодня";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Завтра";
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };
  return date.toLocaleDateString("ru-RU", options);
};

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(value || new Date());

  const handleQuickSelect = useCallback(
    (option: QuickDateOption) => {
      onChange(option.getDate());
    },
    [onChange],
  );

  const handleClearDate = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleDayPress = useCallback(
    (day: number) => {
      const newDate = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        day,
      );
      onChange(newDate);
      setShowCalendar(false);
    },
    [selectedMonth, onChange],
  );

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const renderCalendar = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const today = new Date();
    const isToday = (day: number) =>
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const isSelected = (day: number) =>
      value &&
      day === value.getDate() &&
      month === value.getMonth() &&
      year === value.getFullYear();

    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];

    return (
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.calendarOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {monthNames[month]} {year}
              </Text>
              <Pressable onPress={goToNextMonth} style={styles.navButton}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            <View style={styles.weekDays}>
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => (
                  <Pressable
                    key={dayIndex}
                    style={[
                      styles.dayButton,
                      day !== null && isToday(day) ? styles.todayButton : null,
                      day !== null && isSelected(day)
                        ? styles.selectedDayButton
                        : null,
                    ]}
                    onPress={() => day && handleDayPress(day)}
                    disabled={!day}
                  >
                    {day && (
                      <Text
                        style={[
                          styles.dayText,
                          isToday(day) && styles.todayText,
                          isSelected(day) && styles.selectedDayText,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Дата</Text>
        {value && (
          <Pressable onPress={handleClearDate} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={16}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {value && (
        <View style={styles.selectedDate}>
          <Ionicons name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.selectedDateText}>{formatDate(value)}</Text>
        </View>
      )}

      <View style={styles.quickOptions}>
        {QUICK_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.quickButton,
              pressed && styles.pressed,
            ]}
            onPress={() => handleQuickSelect(option)}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={COLORS.textSecondary}
            />
            <Text style={styles.quickButtonText}>{option.label}</Text>
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [
            styles.quickButton,
            pressed && styles.pressed,
          ]}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons
            name="calendar-number-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.quickButtonText}>Выбрать</Text>
        </Pressable>
      </View>

      {renderCalendar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  selectedDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  selectedDateText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.primary,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: COLORS.surface,
  },
  quickButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: UI_SIZES.cardRadius,
    padding: SPACING.md,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SPACING.sm,
  },
  weekDayText: {
    width: 36,
    textAlign: "center",
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SPACING.xs,
  },
  dayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  todayButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedDayButton: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
