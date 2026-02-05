import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { Task, Priority } from '@/types/task';
import { PRIORITY_COLORS } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const formatDueDate = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isPast = date < today && !isToday;

  if (isToday) return 'Сегодня';
  if (isTomorrow) return 'Завтра';

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return date.toLocaleDateString('ru-RU', options);
};

const getDueDateColor = (date: Date): string => {
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
}) => {
  const handleToggle = useCallback(() => {
    onToggleComplete(task.id);
  }, [task.id, onToggleComplete]);

  const handlePress = useCallback(() => {
    onPress(task.id);
  }, [task.id, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(task.id);
  }, [task.id, onLongPress]);

  const priorityColor = PRIORITY_COLORS[task.priority];
  const showPriorityFlag = task.priority < 4;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
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
          style={[
            styles.title,
            task.completed && styles.titleCompleted,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {(task.dueDate || task.description) && (
          <View style={styles.meta}>
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={getDueDateColor(task.dueDate)}
                />
                <Text
                  style={[
                    styles.dueDate,
                    { color: getDueDateColor(task.dueDate) },
                  ]}
                >
                  {formatDueDate(task.dueDate)}
                  {task.dueTime && ` ${task.dueTime}`}
                </Text>
              </View>
            )}

            {task.labels.length > 0 && (
              <View style={styles.labelsContainer}>
                {task.labels.slice(0, 2).map((label, index) => (
                  <View key={index} style={styles.label}>
                    <Text style={styles.labelText}>{label}</Text>
                  </View>
                ))}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pressed: {
    backgroundColor: COLORS.surface,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: FONT_SIZES.xs,
  },
  labelsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  label: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  priorityFlag: {
    marginLeft: SPACING.sm,
    marginTop: 2,
  },
});
