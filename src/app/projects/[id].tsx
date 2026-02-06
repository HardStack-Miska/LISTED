import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView as SAV } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, PRESET_COLORS } from "@/constants";
import { useTaskContext } from "@/contexts";
import { useProjects, useLabels } from "@/hooks";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task, Priority } from "@/types";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allTasks, toggleTask, deleteTask, createTask } = useTaskContext();
  const { projects, updateProject, deleteProject } = useProjects();
  const { labels } = useLabels();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskDialog, setDeleteTaskDialog] = useState<{
    visible: boolean;
    task: Task | null;
  }>({ visible: false, task: null });

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id],
  );

  const projectTasks = useMemo(() => {
    return allTasks.filter((task) => task.projectId === id);
  }, [allTasks, id]);

  const activeTasks = useMemo(
    () => projectTasks.filter((t) => !t.completed),
    [projectTasks],
  );

  const completedTasks = useMemo(
    () => projectTasks.filter((t) => t.completed),
    [projectTasks],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEditProject = useCallback(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
      setShowEditor(true);
    }
  }, [project]);

  const handleSaveProject = useCallback(async () => {
    if (!name.trim() || !id) return;

    try {
      await updateProject(id, { name: name.trim(), color });
      setShowEditor(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  }, [id, name, color, updateProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!id) return;

    try {
      await deleteProject(id);
      setShowDeleteConfirm(false);
      router.back();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  }, [id, deleteProject, router]);

  const handleTaskPress = useCallback(
    (taskId: string) => {
      router.push(`/task/${taskId}`);
    },
    [router],
  );

  const handleTaskLongPress = useCallback(
    (taskId: string) => {
      const task = projectTasks.find((t) => t.id === taskId);
      if (task) {
        setDeleteTaskDialog({ visible: true, task });
      }
    },
    [projectTasks],
  );

  const handleQuickAdd = useCallback(
    async (taskData: {
      title: string;
      priority: Priority;
      dueDate: Date | null;
      projectId: string | null;
    }) => {
      await createTask({
        title: taskData.title,
        priority: taskData.priority,
        dueDate: taskData.dueDate ?? undefined,
        projectId: id, // Always use current project
      });
      setShowQuickAdd(false);
    },
    [createTask, id],
  );

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        task={item}
        onPress={handleTaskPress}
        onToggleComplete={toggleTask}
        onLongPress={handleTaskLongPress}
        allLabels={labels}
        projects={projects}
      />
    ),
    [handleTaskPress, toggleTask, handleTaskLongPress, labels, projects],
  );

  if (!project) {
    return (
      <SAV style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Проект не найден</Text>
        </View>
      </SAV>
    );
  }

  return (
    <SAV style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View
            style={[styles.projectColor, { backgroundColor: project.color }]}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project.name}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEditProject} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {activeTasks.length} активных · {completedTasks.length} выполненных
        </Text>
      </View>

      <FlatList
        data={activeTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkbox-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>Нет задач</Text>
            <Text style={styles.emptyText}>
              Добавьте первую задачу в проект
            </Text>
          </View>
        }
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>
                Выполнено ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={handleTaskPress}
                  onToggleComplete={toggleTask}
                  onLongPress={handleTaskLongPress}
                  allLabels={labels}
                  projects={projects}
                />
              ))}
            </View>
          ) : null
        }
      />

      <FloatingActionButton onPress={() => setShowQuickAdd(true)} />

      <QuickAddTask
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAdd}
        projects={projects}
        defaultProjectId={id}
      />

      {/* Edit Project Modal */}
      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditor(false)}
      >
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Редактировать</Text>
            <TouchableOpacity
              onPress={handleSaveProject}
              disabled={!name.trim()}
            >
              <Text
                style={[
                  styles.saveText,
                  !name.trim() && styles.saveTextDisabled,
                ]}
              >
                Сохранить
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorContent}>
            <Text style={styles.label}>Название</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Название проекта"
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />

            <Text style={styles.label}>Цвет</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                setShowEditor(false);
                setShowDeleteConfirm(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              <Text style={styles.deleteText}>Удалить проект</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Удалить проект?"
        message={`Проект "${project.name}" будет удален. Задачи останутся, но будут без проекта.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmStyle="destructive"
      />

      <ConfirmDialog
        visible={deleteTaskDialog.visible}
        title={`Удалить "${deleteTaskDialog.task?.title ?? "задачу"}"?`}
        message="Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        confirmStyle="destructive"
        onConfirm={() => {
          if (deleteTaskDialog.task) {
            deleteTask(deleteTaskDialog.task.id);
          }
          setDeleteTaskDialog({ visible: false, task: null });
        }}
        onCancel={() => setDeleteTaskDialog({ visible: false, task: null })}
      />
    </SAV>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  projectColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  editButton: {
    padding: SPACING.xs,
  },
  stats: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  completedSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  completedTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveTextDisabled: {
    color: COLORS.textSecondary,
  },
  editorContent: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  deleteText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
  },
});
