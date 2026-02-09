import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { Task } from '@/types';
import { PRIORITY_COLORS } from '@/types/task';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CALENDAR_PADDING = SPACING.sm * 2;
const DAY_MARGIN = 2;
const DAY_SIZE = (SCREEN_WIDTH - CALENDAR_PADDING - DAY_MARGIN * 14) / 7;

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface CalendarMonthGridProps {
  weeks: (number | null)[][];
  year: number;
  month: number;
  today: Date;
  selectedDate?: Date;
  tasksByDate: Map<string, Task[]>;
  onDayPress: (day: number) => void;
  onTaskPress: (task: Task) => void;
}

const getDotColor = (
  colors: Colors,
  hasOverdue: boolean,
  hasVirtual: boolean,
): string => {
  if (hasOverdue) return colors.error;
  if (hasVirtual) return colors.textSecondary;
  return colors.primary;
};

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  weeks, year, month, today, selectedDate, tasksByDate, onDayPress, onTaskPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isToday = (day: number): boolean =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  const getTasksForDay = (day: number): Task[] =>
    tasksByDate.get(new Date(year, month, day).toDateString()) || [];

  const renderDayCell = (day: number, dayIndex: number) => {
    const dayTasks = getTasksForDay(day);
    const hasOverdue = dayTasks.some((t) => !t.completed && t.dueDate && new Date(t.dueDate) < today);
    const hasVirtual = dayTasks.some((t) => (t as Task & { isVirtual?: boolean }).isVirtual);
    const completedCount = dayTasks.filter((t) => t.completed).length;
    const pendingCount = dayTasks.length - completedCount;
    const dayIsToday = isToday(day);
    const dayIsSelected = isSelected(day);

    return (
      <Pressable
        key={dayIndex}
        testID={`day-${day}`}
        style={[styles.day, dayIsToday && styles.todayDay, dayIsSelected && styles.selectedDay]}
        onPress={() => onDayPress(day)}
      >
        <Text style={[styles.dayNumber, dayIsToday && styles.todayNumber, dayIsSelected && styles.selectedNumber]}>
          {day}
        </Text>
        {dayTasks.length > 0 && (
          <View style={styles.taskIndicators}>
            {pendingCount > 0 && (
              <View style={[styles.taskDot, { backgroundColor: getDotColor(colors, hasOverdue, hasVirtual) }]} />
            )}
            {completedCount > 0 && (
              <View style={[styles.taskDot, { backgroundColor: colors.success }]} />
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      <ScrollView style={styles.calendarGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) =>
              day === null
                ? <View key={dayIndex} style={styles.emptyDay} />
                : renderDayCell(day, dayIndex),
            )}
          </View>
        ))}
      </ScrollView>

      {selectedDate && (
        <SelectedDayTasks
          selectedDate={selectedDate}
          tasksByDate={tasksByDate}
          onTaskPress={onTaskPress}
          styles={styles}
          colors={colors}
        />
      )}
    </>
  );
};

interface SelectedDayTasksProps {
  selectedDate: Date;
  tasksByDate: Map<string, Task[]>;
  onTaskPress: (task: Task) => void;
  styles: ReturnType<typeof createStyles>;
  colors: Colors;
}

const SelectedDayTasks: React.FC<SelectedDayTasksProps> = ({
  selectedDate, tasksByDate, onTaskPress, styles, colors,
}) => {
  const tasks = tasksByDate.get(selectedDate.toDateString());

  return (
    <View style={styles.selectedDayTasks}>
      <Text style={styles.selectedDayTitle}>
        {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
      </Text>
      <ScrollView style={styles.taskList}>
        {tasks?.map((task) => {
          const isVirtual = (task as Task & { isVirtual?: boolean }).isVirtual;
          return (
            <Pressable
              key={task.id}
              style={[styles.taskItem, isVirtual && styles.taskItemVirtual]}
              onPress={() => onTaskPress(task)}
            >
              <View
                style={[
                  styles.taskCheckbox,
                  { borderColor: PRIORITY_COLORS[task.priority] },
                  task.completed && styles.taskCheckboxCompleted,
                ]}
              >
                {task.completed && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              {task.dueTime && <Text style={styles.taskTime}>{task.dueTime}</Text>}
              {isVirtual && <Ionicons name="repeat" size={12} color={colors.textSecondary} />}
              <Text
                style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </Pressable>
          );
        }) || (
          <Text style={styles.noTasksText}>Нет задач на этот день</Text>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekdayText: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    marginHorizontal: DAY_MARGIN,
  },
  calendarGrid: { flex: 1 },
  week: { flexDirection: 'row', paddingHorizontal: SPACING.sm },
  emptyDay: { width: DAY_SIZE, height: DAY_SIZE, margin: DAY_MARGIN },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    margin: DAY_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  todayDay: { borderWidth: 2, borderColor: colors.primary },
  selectedDay: { backgroundColor: colors.primary },
  dayNumber: { fontSize: FONT_SIZES.md, color: colors.text },
  todayNumber: { color: colors.primary, fontWeight: '600' },
  selectedNumber: { color: colors.white, fontWeight: '600' },
  taskIndicators: { flexDirection: 'row', gap: 2, marginTop: 2 },
  taskDot: { width: 6, height: 6, borderRadius: 3 },
  selectedDayTasks: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: SPACING.md,
    maxHeight: 200,
  },
  selectedDayTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  taskList: { maxHeight: 150 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: colors.textSecondary,
    borderColor: colors.textSecondary,
  },
  taskTitle: { flex: 1, fontSize: FONT_SIZES.sm, color: colors.text },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: colors.textSecondary },
  taskTime: {
    fontSize: FONT_SIZES.xs,
    color: colors.primary,
    fontWeight: '500',
    minWidth: 36,
  },
  noTasksText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  taskItemVirtual: {
    opacity: 0.7,
    borderLeftWidth: 2,
    borderLeftColor: colors.textSecondary,
    borderStyle: 'dashed',
    paddingLeft: SPACING.xs,
  },
});
