import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import type { Task, Priority, Label, Project } from "@/types/task";
import { PRIORITY_COLORS } from "@/types/task";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
  allLabels?: Label[];
  projects?: Project[];
}

const isOverdue = (date: Date, completed: boolean): boolean => {
  if (completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(date);
  dueDay.setHours(0, 0, 0, 0);
  return dueDay < today;
};

const formatDueDate = (date: Date, completed: boolean): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Сегодня";
  if (isTomorrow) return "Завтра";
  if (isOverdue(date, completed)) return "Просрочено";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  return date.toLocaleDateString("ru-RU", options);
};

const getDueDateColor = (date: Date, completed: boolean): string => {
  if (completed) return COLORS.textSecondary;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(date);
  dueDay.setHours(0, 0, 0, 0);

  if (dueDay < today) return COLORS.error;
  if (dueDay.getTime() === today.getTime()) return COLORS.primary;
  return COLORS.textSecondary;
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onPress,
  onLongPress,
  allLabels = [],
  projects = [],
}) => {
  const handleToggle = useCallback(() => {
    onToggleComplete(task.id);
  }, [task.id, onToggleComplete]);

  // Get label objects for display
  const taskLabels = useMemo(() => {
    if (!task.labels.length || !allLabels.length) return [];
    return task.labels
      .map((labelId) => allLabels.find((l) => l.id === labelId))
      .filter((l): l is Label => l !== undefined);
  }, [task.labels, allLabels]);

  // Get project for display
  const taskProject = useMemo(() => {
    if (!task.projectId || !projects.length) return null;
    return projects.find((p) => p.id === task.projectId) || null;
  }, [task.projectId, projects]);

  const handlePress = useCallback(() => {
    onPress(task.id);
  }, [task.id, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(task.id);
  }, [task.id, onLongPress]);

  const priorityColor = PRIORITY_COLORS[task.priority];
  const showPriorityFlag = task.priority < 4;
  const taskIsOverdue = task.dueDate && isOverdue(task.dueDate, task.completed);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        taskIsOverdue && styles.overdueContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <Pressable
        style={[
          styles.checkbox,
          { borderColor: priorityColor },
          task.completed && styles.checkboxCompleted,
        ]}
        onPress={handleToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={14} color={COLORS.white} />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[styles.title, task.completed && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {(task.dueDate || task.description) && (
          <View style={styles.meta}>
            {task.dueDate && (
              <View
                style={[
                  styles.dueDateContainer,
                  taskIsOverdue && styles.overdueBadge,
                ]}
              >
                <Ionicons
                  name={taskIsOverdue ? "alert-circle" : "calendar-outline"}
                  size={12}
                  color={getDueDateColor(task.dueDate, task.completed)}
                />
                <Text
                  style={[
                    styles.dueDate,
                    { color: getDueDateColor(task.dueDate, task.completed) },
                    taskIsOverdue && styles.overdueText,
                  ]}
                >
                  {formatDueDate(task.dueDate, task.completed)}
                  {task.dueTime && ` ${task.dueTime}`}
                </Text>
              </View>
            )}

            {taskProject && (
              <View style={styles.projectContainer}>
                <View
                  style={[
                    styles.projectDot,
                    { backgroundColor: taskProject.color },
                  ]}
                />
                <Text style={styles.projectName} numberOfLines={1}>
                  {taskProject.name}
                </Text>
              </View>
            )}

            {taskLabels.length > 0 && (
              <View style={styles.labelsContainer}>
                {taskLabels.slice(0, 2).map((label) => (
                  <View
                    key={label.id}
                    style={[
                      styles.label,
                      { backgroundColor: label.color + "20" },
                    ]}
                  >
                    <View
                      style={[
                        styles.labelDot,
                        { backgroundColor: label.color },
                      ]}
                    />
                    <Text style={[styles.labelText, { color: label.color }]}>
                      {label.name}
                    </Text>
                  </View>
                ))}
                {task.labels.length > 2 && (
                  <Text style={styles.moreLabels}>
                    +{task.labels.length - 2}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {showPriorityFlag && (
        <Ionicons
          name="flag"
          size={18}
          color={priorityColor}
          style={styles.priorityFlag}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  overdueContainer: {
    backgroundColor: COLORS.error + "08",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  pressed: {
    backgroundColor: COLORS.surface,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.textSecondary,
    borderColor: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  overdueBadge: {
    backgroundColor: COLORS.error + "15",
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueDate: {
    fontSize: FONT_SIZES.xs,
  },
  overdueText: {
    fontWeight: "600",
  },
  projectContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    maxWidth: 100,
  },
  labelsContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
  moreLabels: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  priorityFlag: {
    marginLeft: SPACING.sm,
    marginTop: 2,
  },
});
