import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { Task } from '@/types';
import { DayTimeline } from './DayTimeline';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface CalendarDayViewProps {
  selectedDate: Date;
  allTasks: Task[];
  onPrevDay: () => void;
  onNextDay: () => void;
  onBackToMonth: () => void;
  onTaskPress: (task: Task) => void;
  testID?: string;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  selectedDate,
  allTasks,
  onPrevDay,
  onNextDay,
  onBackToMonth,
  onTaskPress,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onPrevDay} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Pressable onPress={onBackToMonth} style={styles.monthButton}>
          <Text style={styles.monthTitle}>
            {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
          </Text>
          <Text style={styles.backHint}>К месяцу</Text>
        </Pressable>

        <Pressable onPress={onNextDay} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </View>

      <DayTimeline
        date={selectedDate}
        tasks={allTasks}
        onTaskPress={onTaskPress}
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
  backHint: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
