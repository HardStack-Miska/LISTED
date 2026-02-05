import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTaskContext } from "@/contexts";
import { useLabels } from "@/hooks/useLabels";
import { useProjects } from "@/hooks/useProjects";
import { TaskItem, QuickAddTask } from "@/components/tasks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task, Priority } from "@/types";

interface DeleteDialogState {
  visible: boolean;
  task: Task | null;
}

export default function TodayScreen() {
  const router = useRouter();
  const {
    allTasks,
    isLoading,
    refresh,
    toggleComplete,
    deleteTask,
    createTask,
    getTodayTasks,
  } = useTaskContext();
  const { labels } = useLabels();
  const { projects } = useProjects();

  // Get today's tasks from context
  const tasks = getTodayTasks();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    visible: false,
    task: null,
  });

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

  const handleTaskPress = useCallback(
    (id: string) => {
      router.push(`/task/${id}`);
    },
    [router],
  );

  const handleTaskLongPress = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        setDeleteDialog({ visible: true, task });
      }
    },
    [tasks],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteDialog.task) {
      await deleteTask(deleteDialog.task.id);
    }
    setDeleteDialog({ visible: false, task: null });
  }, [deleteDialog.task, deleteTask]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ visible: false, task: null });
  }, []);

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
        allLabels={labels}
        projects={projects}
      />
    ),
    [
      handleToggleComplete,
      handleTaskPress,
      handleTaskLongPress,
      labels,
      projects,
    ],
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
                      allLabels={labels}
                      projects={projects}
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
                      allLabels={labels}
                      projects={projects}
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
                      allLabels={labels}
                      projects={projects}
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
        projects={projects}
      />
      <ConfirmDialog
        visible={deleteDialog.visible}
        title={`Удалить "${deleteDialog.task?.title ?? "задачу"}"?`}
        message="Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        confirmStyle="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
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
