import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTaskContext, useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import { CalendarView } from '@/components/tasks';
import type { Task } from '@/types';

export default function CalendarScreen() {
  const router = useRouter();
  const { allTasks } = useTaskContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/task/${task.id}`);
    },
    [router],
  );

  // Count tasks with due dates
  const tasksWithDates = allTasks.filter(
    (t) => t.dueDate && !t.completed,
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Календарь</Text>
        <Text style={styles.headerCount}>{tasksWithDates} запланировано</Text>
      </View>
      <CalendarView
        tasks={allTasks}
        onSelectDate={handleSelectDate}
        onTaskPress={handleTaskPress}
        selectedDate={selectedDate}
      />
      <FloatingActionButton onPress={() => router.push('/task/new')} />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
    },
    headerCount: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
  });
