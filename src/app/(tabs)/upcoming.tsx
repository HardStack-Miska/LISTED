import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTasks } from "@/hooks/useTasks";
import { TaskItem, QuickAddTask } from "@/components/tasks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import type { Task, TaskGroup, Priority } from "@/types";

const getDayName = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) return "Сегодня";
  if (targetDate.getTime() === tomorrow.getTime()) return "Завтра";

  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const monthNames = [
    "янв",
    "фев",
    "мар",
    "апр",
    "мая",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ];

  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
};

const groupTasksByDate = (tasks: Task[]): TaskGroup[] => {
  const groups: Map<string, Task[]> = new Map();
  const noDate: Task[] = [];

  tasks.forEach((task) => {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toDateString();
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, task]);
    } else {
      noDate.push(task);
    }
  });

  const result: TaskGroup[] = [];

  // Sort by date
  const sortedDates = Array.from(groups.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  sortedDates.forEach((dateKey) => {
    const tasksForDate = groups.get(dateKey) || [];
    result.push({
      title: getDayName(new Date(dateKey)),
      tasks: tasksForDate,
    });
  });

  if (noDate.length > 0) {
    result.push({
      title: "Без даты",
      tasks: noDate,
    });
  }

  return result;
};

export default function UpcomingScreen() {
  const { tasks, isLoading, refresh, toggleComplete, deleteTask, createTask } =
    useTasks("upcoming");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleToggleComplete = useCallback(
    async (id: string) => {
      await toggleComplete(id);
    },
    [toggleComplete],
  );

  const handleTaskPress = useCallback((id: string) => {
    console.log("Task pressed:", id);
  }, []);

  const handleTaskLongPress = useCallback(
    async (id: string) => {
      await deleteTask(id);
    },
    [deleteTask],
  );

  const handleAddTask = useCallback(() => {
    setShowQuickAdd(true);
  }, []);

  const handleQuickAddSubmit = useCallback(
    async (task: {
      title: string;
      priority: Priority;
      dueDate: Date | null;
      projectId: string | null;
    }) => {
      await createTask({
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate ?? undefined,
        projectId: task.projectId ?? undefined,
      });
    },
    [createTask],
  );

  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isEmpty = tasks.length === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>Нет предстоящих задач</Text>
          <Text style={styles.emptySubtitle}>
            Запланируйте задачи с датами выполнения
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {groupedTasks.map((group) => (
            <View key={group.title}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{group.title}</Text>
                <Text style={styles.sectionCount}>{group.tasks.length}</Text>
              </View>
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onPress={handleTaskPress}
                  onLongPress={handleTaskLongPress}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      <FloatingActionButton onPress={handleAddTask} />
      <QuickAddTask
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAddSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});
