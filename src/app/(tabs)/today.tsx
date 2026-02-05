import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTasks } from "@/hooks/useTasks";
import { TaskItem, QuickAddTask } from "@/components/tasks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import type { Task, Priority } from "@/types";

export default function TodayScreen() {
  const { tasks, isLoading, refresh, toggleComplete, deleteTask, createTask } =
    useTasks("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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
    // TODO: Navigate to task details
    console.log("Task pressed:", id);
  }, []);

  const handleTaskLongPress = useCallback(
    async (id: string) => {
      // TODO: Show action menu
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

  // Separate overdue and today tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < today && !task.completed,
  );
  const todayTasks = tasks.filter(
    (task) =>
      !task.completed &&
      (!task.dueDate ||
        new Date(task.dueDate).toDateString() === today.toDateString()),
  );
  const completedTasks = tasks.filter((task) => task.completed);

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        task={item}
        onToggleComplete={handleToggleComplete}
        onPress={handleTaskPress}
        onLongPress={handleTaskLongPress}
      />
    ),
    [handleToggleComplete, handleTaskPress, handleTaskLongPress],
  );

  const renderSectionHeader = (
    title: string,
    count: number,
    isOverdue = false,
  ) => (
    <View style={styles.sectionHeader}>
      <Text
        style={[styles.sectionTitle, isOverdue && styles.sectionTitleOverdue]}
      >
        {title}
      </Text>
      <Text
        style={[styles.sectionCount, isOverdue && styles.sectionCountOverdue]}
      >
        {count}
      </Text>
    </View>
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
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>Всё выполнено!</Text>
          <Text style={styles.emptySubtitle}>Добавьте задачи на сегодня</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {overdueTasks.length > 0 && (
                <>
                  {renderSectionHeader("Просрочено", overdueTasks.length, true)}
                  {overdueTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onPress={handleTaskPress}
                      onLongPress={handleTaskLongPress}
                    />
                  ))}
                </>
              )}

              {todayTasks.length > 0 && (
                <>
                  {renderSectionHeader("Сегодня", todayTasks.length)}
                  {todayTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onPress={handleTaskPress}
                      onLongPress={handleTaskLongPress}
                    />
                  ))}
                </>
              )}

              {completedTasks.length > 0 && (
                <>
                  {renderSectionHeader("Выполнено", completedTasks.length)}
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onPress={handleTaskPress}
                      onLongPress={handleTaskLongPress}
                    />
                  ))}
                </>
              )}
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
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
  sectionTitleOverdue: {
    color: COLORS.error,
  },
  sectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  sectionCountOverdue: {
    color: COLORS.error,
  },
});
