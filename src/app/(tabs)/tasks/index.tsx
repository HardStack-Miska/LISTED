import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTasks } from "@/hooks/useTasks";
import { useProjects, useLabels } from "@/hooks";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import type { Task, Project, Label, Priority } from "@/types";

type FilterType = "all" | "upcoming" | "project" | "label";

interface FilterChip {
  id: string;
  type: FilterType;
  label: string;
  icon: string;
  color?: string;
}

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, isLoading, toggleTask, deleteTask, createTask } =
    useTasks("all");
  const { projects } = useProjects();
  const { labels } = useLabels();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Build filter chips
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [
      { id: "all", type: "all", label: "Все", icon: "list" },
      {
        id: "upcoming",
        type: "upcoming",
        label: "Предстоящие",
        icon: "time-outline",
      },
    ];

    // Add projects as filters
    projects.forEach((project) => {
      chips.push({
        id: `project-${project.id}`,
        type: "project",
        label: project.name,
        icon: "folder",
        color: project.color,
      });
    });

    // Add labels as filters
    labels.forEach((label) => {
      chips.push({
        id: `label-${label.id}`,
        type: "label",
        label: label.name,
        icon: "pricetag",
        color: label.color,
      });
    });

    return chips;
  }, [projects, labels]);

  // Filter tasks based on active filter
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeFilter) {
      case "upcoming":
        return tasks
          .filter((task) => {
            if (!task.dueDate || task.completed) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today;
          })
          .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          });

      case "project":
        if (!selectedProjectId) return tasks;
        return tasks.filter((task) => task.projectId === selectedProjectId);

      case "label":
        if (!selectedLabelId) return tasks;
        return tasks.filter((task) => task.labels.includes(selectedLabelId));

      default:
        return tasks;
    }
  }, [tasks, activeFilter, selectedProjectId, selectedLabelId]);

  // Group tasks by completion status
  const groupedTasks = useMemo(() => {
    const active = filteredTasks.filter((t) => !t.completed);
    const completed = filteredTasks.filter((t) => t.completed);
    return { active, completed };
  }, [filteredTasks]);

  const handleFilterPress = useCallback((chip: FilterChip) => {
    if (chip.type === "project") {
      setActiveFilter("project");
      setSelectedProjectId(chip.id.replace("project-", ""));
      setSelectedLabelId(null);
    } else if (chip.type === "label") {
      setActiveFilter("label");
      setSelectedLabelId(chip.id.replace("label-", ""));
      setSelectedProjectId(null);
    } else {
      setActiveFilter(chip.type);
      setSelectedProjectId(null);
      setSelectedLabelId(null);
    }
  }, []);

  const handleTaskPress = useCallback(
    (id: string) => {
      router.push(`/task/${id}`);
    },
    [router],
  );

  const handleTaskLongPress = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      Alert.alert(task.title, "Выберите действие", [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => deleteTask(id),
        },
      ]);
    },
    [tasks, deleteTask],
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
        projectId: taskData.projectId ?? selectedProjectId ?? undefined,
        labels: selectedLabelId ? [selectedLabelId] : undefined,
      });
      setShowQuickAdd(false);
    },
    [createTask, selectedProjectId, selectedLabelId],
  );

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        task={item}
        onPress={handleTaskPress}
        onToggleComplete={toggleTask}
        onLongPress={handleTaskLongPress}
        allLabels={labels}
      />
    ),
    [handleTaskPress, toggleTask, handleTaskLongPress, labels],
  );

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "upcoming":
        return "Предстоящие";
      case "project":
        const project = projects.find((p) => p.id === selectedProjectId);
        return project?.name ?? "Проект";
      case "label":
        const label = labels.find((l) => l.id === selectedLabelId);
        return label?.name ?? "Метка";
      default:
        return "Все задачи";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getFilterTitle()}</Text>
        <Text style={styles.count}>{groupedTasks.active.length} активных</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filterChips.map((chip) => {
          const isActive =
            (chip.type === activeFilter &&
              chip.type !== "project" &&
              chip.type !== "label") ||
            (chip.type === "project" &&
              chip.id === `project-${selectedProjectId}`) ||
            (chip.type === "label" && chip.id === `label-${selectedLabelId}`);

          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
                chip.color && isActive && { backgroundColor: chip.color },
              ]}
              onPress={() => handleFilterPress(chip)}
            >
              {chip.color && !isActive ? (
                <View
                  style={[styles.colorDot, { backgroundColor: chip.color }]}
                />
              ) : (
                <Ionicons
                  name={chip.icon as any}
                  size={16}
                  color={isActive ? "#FFFFFF" : COLORS.textSecondary}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task list */}
      <FlatList
        data={groupedTasks.active}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkbox-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>Нет задач</Text>
            <Text style={styles.emptyText}>
              Нажмите + чтобы добавить задачу
            </Text>
          </View>
        }
        ListFooterComponent={
          groupedTasks.completed.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>
                Выполнено ({groupedTasks.completed.length})
              </Text>
              {groupedTasks.completed.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={handleTaskPress}
                  onToggleComplete={toggleTask}
                  onLongPress={handleTaskLongPress}
                  allLabels={labels}
                />
              ))}
            </View>
          ) : null
        }
      />

      {/* Quick Add */}
      <QuickAddTask
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAdd}
        projects={projects}
      />

      <FloatingActionButton onPress={() => setShowQuickAdd(true)} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    padding: SPACING.md,
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
  },
});
