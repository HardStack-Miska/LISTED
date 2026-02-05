import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { databaseService } from "@/services/database";
import { useProjects, useLabels } from "@/hooks";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { DatePicker } from "@/components/tasks/DatePicker";
import { ProjectPicker, ProjectPickerInline } from "@/components/projects";
import { LabelPicker, LabelPickerInline } from "@/components/labels";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task, Priority } from "@/types";
import { PRIORITY_COLORS } from "@/types/task";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { projects } = useProjects();
  const { labels, addLabelToTask, removeLabelFromTask } = useLabels();

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(4);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;

      try {
        const loadedTask = await databaseService.getTask(id);
        if (loadedTask) {
          setTask(loadedTask);
          setTitle(loadedTask.title);
          setDescription(loadedTask.description ?? "");
          setPriority(loadedTask.priority);
          setDueDate(loadedTask.dueDate ?? null);
          setProjectId(loadedTask.projectId);
          setSelectedLabelIds(loadedTask.labels);
        }

        const loadedSubtasks = await databaseService.getSubtasks(id);
        setSubtasks(loadedSubtasks);
      } catch (error) {
        console.error("Error loading task:", error);
        Alert.alert("Ошибка", "Не удалось загрузить задачу");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!id || !title.trim()) return;

    setIsSaving(true);
    try {
      await databaseService.updateTask(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ?? null,
        projectId: projectId ?? null,
      });

      // Update labels
      const currentLabels = task?.labels ?? [];
      const toAdd = selectedLabelIds.filter((l) => !currentLabels.includes(l));
      const toRemove = currentLabels.filter(
        (l) => !selectedLabelIds.includes(l),
      );

      for (const labelId of toAdd) {
        await addLabelToTask(id, labelId);
      }
      for (const labelId of toRemove) {
        await removeLabelFromTask(id, labelId);
      }

      router.back();
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Ошибка", "Не удалось сохранить задачу");
    } finally {
      setIsSaving(false);
    }
  }, [
    id,
    title,
    description,
    priority,
    dueDate,
    projectId,
    selectedLabelIds,
    task,
    addLabelToTask,
    removeLabelFromTask,
    router,
  ]);

  const handleToggleComplete = useCallback(async () => {
    if (!id) return;

    try {
      await databaseService.toggleTaskComplete(id);
      setTask((prev) =>
        prev ? { ...prev, completed: !prev.completed } : null,
      );
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;

    try {
      await databaseService.deleteTask(id);
      router.back();
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Ошибка", "Не удалось удалить задачу");
    }
  }, [id, router]);

  const handleAddSubtask = useCallback(
    async (subtaskTitle: string) => {
      if (!id) return;

      try {
        const result = await databaseService.createSubtask(id, {
          title: subtaskTitle,
        });
        const newSubtask = await databaseService.getTask(result.id);
        if (newSubtask) {
          setSubtasks((prev) => [...prev, newSubtask]);
        }
      } catch (error) {
        console.error("Error creating subtask:", error);
      }
    },
    [id],
  );

  const handleToggleSubtask = useCallback(async (subtaskId: string) => {
    try {
      await databaseService.toggleTaskComplete(subtaskId);
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s,
        ),
      );
    } catch (error) {
      console.error("Error toggling subtask:", error);
    }
  }, []);

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      await databaseService.deleteTask(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  }, []);

  const handleLabelToggle = useCallback((labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={COLORS.textSecondary}
        />
        <Text style={styles.errorText}>Задача не найдена</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.headerButton}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving || !title.trim()}
          >
            <Text style={styles.saveText}>
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={handleToggleComplete}
          >
            <Ionicons
              name={task.completed ? "checkbox" : "square-outline"}
              size={28}
              color={task.completed ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TextInput
            style={[styles.titleInput, task.completed && styles.titleCompleted]}
            value={title}
            onChangeText={setTitle}
            placeholder="Название задачи"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>

        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Добавить описание..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowPriorityPicker(true)}
          >
            <View style={styles.fieldLeft}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.fieldLabel}>Приоритет</Text>
            </View>
            <View style={styles.fieldRight}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(priority) },
                ]}
              >
                <Text style={styles.priorityText}>P{priority}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.fieldLabel}>Дата</Text>
            </View>
            <View style={styles.datePickerWrapper}>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </View>
          </View>

          <ProjectPickerInline
            projects={projects}
            selectedId={projectId}
            onPress={() => setShowProjectPicker(true)}
          />

          <LabelPickerInline
            labels={labels}
            selectedIds={selectedLabelIds}
            onPress={() => setShowLabelPicker(true)}
          />
        </View>

        <View style={styles.section}>
          <SubtaskList
            subtasks={subtasks}
            onToggle={handleToggleSubtask}
            onDelete={handleDeleteSubtask}
            onAdd={handleAddSubtask}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showPriorityPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPriorityPicker(false)}
      >
        <SafeAreaView style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Выберите приоритет</Text>
            <TouchableOpacity onPress={() => setShowPriorityPicker(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.priorityOptions}>
            {([1, 2, 3, 4] as Priority[]).map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.priorityOption,
                  priority === p && styles.priorityOptionSelected,
                ]}
                onPress={() => {
                  setPriority(p);
                  setShowPriorityPicker(false);
                }}
              >
                <Ionicons
                  name={priority === p ? "flag" : "flag-outline"}
                  size={24}
                  color={PRIORITY_COLORS[p]}
                />
                <Text style={styles.priorityOptionText}>Приоритет {p}</Text>
                {priority === p && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      <ProjectPicker
        visible={showProjectPicker}
        projects={projects}
        selectedId={projectId}
        onSelect={setProjectId}
        onClose={() => setShowProjectPicker(false)}
      />

      <LabelPicker
        visible={showLabelPicker}
        labels={labels}
        selectedIds={selectedLabelIds}
        onToggle={handleLabelToggle}
        onClose={() => setShowLabelPicker(false)}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Удалить задачу?"
        message="Это действие нельзя отменить. Все подзадачи также будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmStyle="destructive"
      />
    </View>
  );
}

const getPriorityColor = (priority: Priority): string => {
  return PRIORITY_COLORS[priority];
};

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  checkbox: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  titleInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.text,
    padding: 0,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  descriptionInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    minHeight: 100,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  fieldRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  priorityOptions: {
    padding: SPACING.md,
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  priorityOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  priorityOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  datePickerWrapper: {
    flex: 1,
    marginLeft: SPACING.md,
  },
});
