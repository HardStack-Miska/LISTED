import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SPACING, FONT_SIZES } from "@/constants";
import { useTaskContext, useTheme, useSnackbar } from "@/contexts";
import type { Colors } from "@/contexts";
import { useLabels } from "@/hooks/useLabels";
import { useProjects } from "@/hooks/useProjects";
import { TaskItem } from "@/components/tasks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { filterOverdueTasks, filterTodayTasks, filterCompletedTasks } from "@/utils/dateFilters";
import type { Task } from "@/types";

interface DeleteDialogState {
  visible: boolean;
  task: Task | null;
}

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    allTasks,
    isLoading,
    refresh,
    toggleComplete,
    deleteTask,
    getTodayTasks,
  } = useTaskContext();
  const { labels } = useLabels();
  const { projects } = useProjects();
  const { showSnackbar } = useSnackbar();

  // Get today's tasks from context
  const tasks = getTodayTasks();
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      const task = allTasks.find((t) => t.id === id);
      if (!task) return;

      const wasCompleted = task.completed;
      await toggleComplete(id);

      if (!wasCompleted) {
        showSnackbar('Задача выполнена', {
          actionLabel: 'Отменить',
          onAction: async () => {
            await toggleComplete(id);
          },
          duration: 5000,
        });
      }
    },
    [toggleComplete, allTasks, showSnackbar],
  );

  const handleTaskPress = useCallback(
    (id: string) => {
      router.push(`/task/${id}`);
    },
    [router],
  );

  const handleTaskLongPress = useCallback(
    (id: string) => {
      // Use allTasks to find task even if it's the last one
      const task = allTasks.find((t) => t.id === id);
      if (task) {
        setDeleteDialog({ visible: true, task });
      }
    },
    [allTasks],
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

  const overdueTasks = filterOverdueTasks(tasks);
  const todayTasks = filterTodayTasks(tasks);
  const completedTasks = filterCompletedTasks(tasks);

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

  // Count active tasks for header
  const activeTasksCount = todayTasks.length + overdueTasks.length;

  if (isLoading && tasks.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isEmpty = tasks.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сегодня</Text>
        <Text style={styles.headerCount}>{activeTasksCount} активных</Text>
      </View>
      {isEmpty ? (
        <EmptyState
          emoji="🎯"
          title="Всё выполнено!"
          description="Добавьте задачи на сегодня"
          actionLabel="Добавить задачу"
          onAction={() => router.push("/task/new")}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
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
        </ScrollView>
      )}
      <FloatingActionButton onPress={() => router.push("/task/new")} />
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
      color: colors.text,
    },
    headerCount: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.text,
    },
    sectionTitleOverdue: {
      color: colors.error,
    },
    sectionCount: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginLeft: SPACING.sm,
    },
    sectionCountOverdue: {
      color: colors.error,
    },
  });
