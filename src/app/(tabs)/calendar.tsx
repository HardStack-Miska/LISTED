import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTaskContext } from "@/contexts";
import { CalendarView } from "@/components/tasks";
import type { Task } from "@/types";

export default function CalendarScreen() {
  const router = useRouter();
  const { allTasks } = useTaskContext();
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
    <SafeAreaView style={styles.container} edges={["top"]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
