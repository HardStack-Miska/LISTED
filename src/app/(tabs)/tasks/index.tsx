import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useTaskContext } from "@/contexts";
import { useProjects, useLabels } from "@/hooks";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task, Project, Label, Priority } from "@/types";

type FilterType = "all" | "upcoming" | "project" | "label";
type SortType = "default" | "priority" | "date" | "name";

interface FilterChip {
  id: string;
  type: FilterType;
  label: string;
  icon: string;
  color?: string;
}

const SORT_OPTIONS: { value: SortType; label: string; icon: string }[] = [
  { value: "default", label: "По умолчанию", icon: "swap-vertical" },
  { value: "priority", label: "По приоритету", icon: "flag" },
  { value: "date", label: "По дате", icon: "calendar" },
  { value: "name", label: "По имени", icon: "text" },
];

export default function TasksScreen() {
  const router = useRouter();
  const {
    allTasks: tasks,
    isLoading,
    toggleTask,
    deleteTask,
    createTask,
  } = useTaskContext();
  const { projects } = useProjects();
  const { labels } = useLabels();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>("default");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    visible: boolean;
    task: Task | null;
  }>({
    visible: false,
    task: null,
  });

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

  // Sort function
  const sortTasks = useCallback(
    (tasksToSort: Task[], sort: SortType): Task[] => {
      if (sort === "default") return tasksToSort;

      return [...tasksToSort].sort((a, b) => {
        switch (sort) {
          case "priority":
            // Higher priority first (1 is highest)
            if (a.priority !== b.priority) return a.priority - b.priority;
            // Then by date
            if (a.dueDate && b.dueDate) {
              return (
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              );
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;

          case "date":
            // Tasks with date first, sorted by date
            if (a.dueDate && b.dueDate) {
              return (
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              );
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            // Then by priority
            return a.priority - b.priority;

          case "name":
            return a.title.localeCompare(b.title, "ru");

          default:
            return 0;
        }
      });
    },
    [],
  );

  // Filter tasks based on active filter
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result: Task[];

    switch (activeFilter) {
      case "upcoming":
        result = tasks.filter((task) => {
          if (!task.dueDate || task.completed) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today;
        });
        break;

      case "project":
        result = selectedProjectId
          ? tasks.filter((task) => task.projectId === selectedProjectId)
          : tasks;
        break;

      case "label":
        result = selectedLabelId
          ? tasks.filter((task) => task.labels.includes(selectedLabelId))
          : tasks;
        break;

      default:
        result = tasks;
    }

    return sortTasks(result, sortType);
  }, [
    tasks,
    activeFilter,
    selectedProjectId,
    selectedLabelId,
    sortType,
    sortTasks,
  ]);

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

      setDeleteDialog({ visible: true, task });
    },
    [tasks],
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
        projects={projects}
      />
    ),
    [handleTaskPress, toggleTask, handleTaskLongPress, labels, projects],
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
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{getFilterTitle()}</Text>
          <Text style={styles.count}>
            {groupedTasks.active.length} активных
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons
            name={
              (SORT_OPTIONS.find((o) => o.value === sortType)?.icon as any) ||
              "swap-vertical"
            }
            size={20}
            color={
              sortType !== "default" ? COLORS.primary : COLORS.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Sort menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortType === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortType(option.value);
                setShowSortMenu(false);
              }}
            >
              <Ionicons
                name={option.icon as any}
                size={18}
                color={
                  sortType === option.value
                    ? COLORS.primary
                    : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortType === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortType === option.value && (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

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
                  projects={projects}
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

      <ConfirmDialog
        visible={deleteDialog.visible}
        title={`Удалить "${deleteDialog.task?.title ?? "задачу"}"?`}
        message="Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        confirmStyle="destructive"
        onConfirm={() => {
          if (deleteDialog.task) {
            deleteTask(deleteDialog.task.id);
          }
          setDeleteDialog({ visible: false, task: null });
        }}
        onCancel={() => setDeleteDialog({ visible: false, task: null })}
      />
    </SafeAreaView>
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
  sortButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  sortMenu: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary + "15",
  },
  sortOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "500",
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
