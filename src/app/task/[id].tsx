import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { databaseService } from "@/services/database";
import { useProjects, useLabels } from "@/hooks";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { DatePicker } from "@/components/tasks/DatePicker";
import { ProjectPicker, ProjectPickerInline } from "@/components/projects";
import { LabelPicker, LabelPickerInline } from "@/components/labels";
import { HoldToDeleteButton } from "@/components/ui/HoldToDeleteButton";
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

  // Autosave refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

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
        // Mark initial load complete after a short delay
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadTask();
  }, [id]);

  // Autosave function
  const performSave = useCallback(async () => {
    if (!id || !title.trim() || isInitialLoadRef.current) return;

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

      // Update local task state
      setTask((prev) => (prev ? { ...prev, labels: selectedLabelIds } : null));
    } catch (error) {
      console.error("Error saving task:", error);
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
  ]);

  // Debounced autosave effect
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    title,
    description,
    priority,
    dueDate,
    projectId,
    selectedLabelIds,
    performSave,
  ]);

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
        ? prev.filter((lid) => lid !== labelId)
        : [...prev, labelId],
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={COLORS.textSecondary}
        />
        <Text style={styles.errorText}>Задача не найдена</Text>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.savingText}>Сохранение...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Название задачи"
          placeholderTextColor={COLORS.textSecondary}
          multiline
        />

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

          <View style={styles.dateSection}>
            <View style={styles.dateLabelRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.fieldLabel}>Дата</Text>
            </View>
            <DatePicker value={dueDate} onChange={setDueDate} />
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

        <View style={styles.deleteSection}>
          <HoldToDeleteButton onDelete={handleDelete} />
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
    </SafeAreaView>
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
  backButtonError: {
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingRight: SPACING.sm,
  },
  savingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  titleInput: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.text,
    padding: 0,
    marginBottom: SPACING.md,
  },
  descriptionInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    minHeight: 80,
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
  dateSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
  },
  dateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  deleteSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
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
});
