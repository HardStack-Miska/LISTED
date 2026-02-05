import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants";
import { useTasks } from "@/hooks/useTasks";
import { CalendarView } from "@/components/tasks";
import type { Task } from "@/types";

export default function CalendarScreen() {
  const router = useRouter();
  const { tasks } = useTasks("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleTaskPress = useCallback((task: Task) => {
    // TODO: Navigate to task details
    console.log("Task pressed:", task.id);
  }, []);

  return (
    <View style={styles.container}>
      <CalendarView
        tasks={tasks}
        onSelectDate={handleSelectDate}
        onTaskPress={handleTaskPress}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
