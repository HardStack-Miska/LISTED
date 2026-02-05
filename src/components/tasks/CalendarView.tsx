import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import type { Task } from "@/types";
import { PRIORITY_COLORS } from "@/types/task";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CALENDAR_PADDING = SPACING.sm * 2;
const DAY_MARGIN = 2;
const DAY_SIZE = (SCREEN_WIDTH - CALENDAR_PADDING - DAY_MARGIN * 14) / 7;

interface CalendarViewProps {
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onTaskPress?: (task: Task) => void;
  selectedDate?: Date;
  testID?: string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
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

const getMonthDays = (year: number, month: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const days: (number | null)[] = [];

  // Empty slots before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectDate,
  onTaskPress,
  selectedDate,
  testID,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = useMemo(() => new Date(), []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });

    return map;
  }, [tasks]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    onSelectDate(new Date());
  }, [onSelectDate]);

  const handleDayPress = useCallback(
    (day: number) => {
      const date = new Date(year, month, day);
      onSelectDate(date);
    },
    [year, month, onSelectDate],
  );

  const getTasksForDay = (day: number): Task[] => {
    const date = new Date(year, month, day);
    return tasksByDate.get(date.toDateString()) || [];
  };

  const isToday = (day: number): boolean => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Split days into weeks, ensuring each week has exactly 7 slots
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    // Pad the last week with nulls if needed
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goToPreviousMonth}
          style={styles.navButton}
          testID="prev-month"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>

        <Pressable onPress={goToToday} style={styles.monthButton}>
          <Text style={styles.monthTitle}>
            {MONTHS[month]} {year}
          </Text>
        </Pressable>

        <Pressable
          onPress={goToNextMonth}
          style={styles.navButton}
          testID="next-month"
        >
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <ScrollView style={styles.calendarGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.emptyDay} />;
              }

              const dayTasks = getTasksForDay(day);
              const hasOverdue = dayTasks.some(
                (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today,
              );
              const completedCount = dayTasks.filter((t) => t.completed).length;
              const pendingCount = dayTasks.length - completedCount;

              return (
                <Pressable
                  key={dayIndex}
                  testID={`day-${day}`}
                  style={[
                    styles.day,
                    isToday(day) && styles.todayDay,
                    isSelected(day) && styles.selectedDay,
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday(day) && styles.todayNumber,
                      isSelected(day) && styles.selectedNumber,
                    ]}
                  >
                    {day}
                  </Text>

                  {dayTasks.length > 0 && (
                    <View style={styles.taskIndicators}>
                      {pendingCount > 0 && (
                        <View
                          style={[
                            styles.taskDot,
                            {
                              backgroundColor: hasOverdue
                                ? COLORS.error
                                : COLORS.primary,
                            },
                          ]}
                        />
                      )}
                      {completedCount > 0 && (
                        <View
                          style={[
                            styles.taskDot,
                            { backgroundColor: COLORS.success },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Selected day tasks */}
      {selectedDate && (
        <View style={styles.selectedDayTasks}>
          <Text style={styles.selectedDayTitle}>
            {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
          </Text>

          <ScrollView style={styles.taskList}>
            {tasksByDate.get(selectedDate.toDateString())?.map((task) => (
              <Pressable
                key={task.id}
                style={styles.taskItem}
                onPress={() => onTaskPress?.(task)}
              >
                <View
                  style={[
                    styles.taskCheckbox,
                    { borderColor: PRIORITY_COLORS[task.priority] },
                    task.completed && styles.taskCheckboxCompleted,
                  ]}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.taskTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </Pressable>
            )) || (
              <Text style={styles.noTasksText}>Нет задач на этот день</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  navButton: {
    padding: SPACING.sm,
  },
  monthButton: {
    padding: SPACING.sm,
  },
  monthTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  weekdays: {
    flexDirection: "row",
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekdayText: {
    width: DAY_SIZE,
    textAlign: "center",
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginHorizontal: DAY_MARGIN,
  },
  calendarGrid: {
    flex: 1,
  },
  week: {
    flexDirection: "row",
    paddingHorizontal: SPACING.sm,
  },
  emptyDay: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    margin: DAY_MARGIN,
  },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    margin: DAY_MARGIN,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  todayNumber: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  selectedNumber: {
    color: COLORS.white,
    fontWeight: "600",
  },
  taskIndicators: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedDayTasks: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
    maxHeight: 200,
  },
  selectedDayTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  taskList: {
    maxHeight: 150,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxCompleted: {
    backgroundColor: COLORS.textSecondary,
    borderColor: COLORS.textSecondary,
  },
  taskTitle: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  noTasksText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: SPACING.md,
  },
});
