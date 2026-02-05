import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import { PRIORITY_COLORS } from '@/types/task';
import type { Priority } from '@/types/task';
import type { BlockComponentProps } from '@/types/editor';

const formatDueDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) return 'Сегодня';
  if (targetDate.getTime() === tomorrow.getTime()) return 'Завтра';

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return date.toLocaleDateString('ru-RU', options);
};

const getDueDateColor = (dateStr?: string): string => {
  if (!dateStr) return COLORS.textSecondary;

  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate < today) return COLORS.error;
  if (targetDate.getTime() === today.getTime()) return COLORS.primary;
  return COLORS.textSecondary;
};

export const TaskBlock: React.FC<BlockComponentProps> = ({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onDelete,
  onEnterPress,
  onBackspaceEmpty,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [localText, setLocalText] = useState(block.data.text || '');

  const priority = (block.data.priority || 4) as Priority;
  const completed = block.data.completed || false;
  const dueDate = block.data.dueDate;
  const priorityColor = PRIORITY_COLORS[priority];

  const handleToggleComplete = useCallback(() => {
    onChange({
      ...block.data,
      completed: !completed,
    });
  }, [block.data, completed, onChange]);

  const handleTextChange = useCallback((text: string) => {
    setLocalText(text);
    onChange({
      ...block.data,
      text,
    });
  }, [block.data, onChange]);

  const handleKeyPress = useCallback(({ nativeEvent }: { nativeEvent: { key: string } }) => {
    if (nativeEvent.key === 'Enter') {
      onEnterPress();
    } else if (nativeEvent.key === 'Backspace' && localText === '') {
      onBackspaceEmpty();
    }
  }, [localText, onEnterPress, onBackspaceEmpty]);

  const handlePriorityPress = useCallback(() => {
    // Cycle through priorities: 4 -> 1 -> 2 -> 3 -> 4
    const nextPriority = priority === 4 ? 1 : ((priority + 1) as Priority);
    onChange({
      ...block.data,
      priority: nextPriority,
    });
  }, [block.data, priority, onChange]);

  const dueDateStr = formatDueDate(dueDate);
  const dueDateColor = getDueDateColor(dueDate);

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.checkbox,
          { borderColor: priorityColor },
          completed && styles.checkboxCompleted,
        ]}
        onPress={handleToggleComplete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {completed && (
          <Ionicons name="checkmark" size={14} color={COLORS.white} />
        )}
      </Pressable>

      <View style={styles.content}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            completed && styles.inputCompleted,
            isFocused && styles.inputFocused,
          ]}
          value={localText}
          onChangeText={handleTextChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
          placeholder="Новая задача..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          blurOnSubmit={false}
        />

        <View style={styles.meta}>
          {dueDateStr && (
            <View style={styles.dueDateContainer}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={dueDateColor}
              />
              <Text style={[styles.dueDate, { color: dueDateColor }]}>
                {dueDateStr}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Pressable
        style={styles.priorityButton}
        onPress={handlePriorityPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={priority < 4 ? 'flag' : 'flag-outline'}
          size={18}
          color={priorityColor}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.textSecondary,
    borderColor: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  input: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: 0,
    margin: 0,
    lineHeight: 22,
  },
  inputCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  inputFocused: {
    // No specific style needed, but can be customized
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
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
  priorityButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
