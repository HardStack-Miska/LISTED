import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { Task } from '@/types';
import { generateVirtualOccurrences } from '@/utils/recurrence';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarDayView } from './CalendarDayView';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface CalendarViewProps {
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onTaskPress?: (task: Task) => void;
  selectedDate?: Date;
  testID?: string;
}

const getMonthDays = (year: number, month: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const days: (number | null)[] = [];

  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
};

const buildWeeks = (days: (number | null)[]): (number | null)[][] => {
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7);
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }
  return weeks;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectDate,
  onTaskPress,
  selectedDate,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const today = useMemo(() => new Date(), []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const weeks = useMemo(() => buildWeeks(days), [days]);

  const allTasks = useMemo(() => {
    const virtual = generateVirtualOccurrences(tasks, 90);
    return [...tasks, ...virtual];
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [allTasks]);

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
      setViewMode('day');
    },
    [year, month, onSelectDate],
  );

  const handleBackToMonth = useCallback(() => {
    setViewMode('month');
  }, []);

  const updateMonthIfNeeded = useCallback(
    (date: Date) => {
      if (
        date.getMonth() !== currentMonth.getMonth() ||
        date.getFullYear() !== currentMonth.getFullYear()
      ) {
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    },
    [currentMonth],
  );

  const handlePrevDay = useCallback(() => {
    if (!selectedDate) return;
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
    updateMonthIfNeeded(prev);
  }, [selectedDate, onSelectDate, updateMonthIfNeeded]);

  const handleNextDay = useCallback(() => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
    updateMonthIfNeeded(next);
  }, [selectedDate, onSelectDate, updateMonthIfNeeded]);

  const handleDayTaskPress = useCallback(
    (task: Task) => {
      const virtualTask = task as Task & { isVirtual?: boolean; sourceTaskId?: string };
      if (virtualTask.isVirtual && virtualTask.sourceTaskId) {
        onTaskPress?.({ ...task, id: virtualTask.sourceTaskId });
      } else {
        onTaskPress?.(task);
      }
    },
    [onTaskPress],
  );

  if (viewMode === 'day' && selectedDate) {
    return (
      <CalendarDayView
        selectedDate={selectedDate}
        allTasks={allTasks}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onBackToMonth={handleBackToMonth}
        onTaskPress={handleDayTaskPress}
        testID={testID}
      />
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Month header */}
      <View style={styles.header}>
        <Pressable
          onPress={goToPreviousMonth}
          style={styles.navButton}
          testID="prev-month"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
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
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </View>

      <CalendarMonthGrid
        weeks={weeks}
        year={year}
        month={month}
        today={today}
        selectedDate={selectedDate}
        tasksByDate={tasksByDate}
        onDayPress={handleDayPress}
        onTaskPress={handleDayTaskPress}
      />
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '600',
    color: colors.text,
  },
});
