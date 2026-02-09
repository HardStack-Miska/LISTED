import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SPACING, FONT_SIZES } from "@/constants";
import { useTheme } from "@/contexts";
import type { Colors } from "@/contexts";
import { useTasks } from "@/hooks/useTasks";
import { TaskItem } from "@/components/tasks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { groupTasksByDate } from "@/utils/dateFilters";
import type { Task } from "@/types";

interface DeleteDialogState {
  visible: boolean;
  task: Task | null;
}

export default function UpcomingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { tasks, isLoading, refresh, toggleComplete, deleteTask } =
    useTasks("upcoming");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    visible: false,
    task: null,
  });

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

  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isEmpty = tasks.length === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <EmptyState
          emoji="📅"
          title="Нет предстоящих задач"
          description="Запланируйте задачи с датами выполнения"
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
      <FloatingActionButton onPress={() => router.push("/task/new")} />
      <ConfirmDialog
        visible={deleteDialog.visible}
        title="Удалить задачу?"
        message={`Задача "${deleteDialog.task?.title}" будет удалена навсегда.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmStyle="destructive"
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    sectionCount: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginLeft: SPACING.sm,
    },
  });
