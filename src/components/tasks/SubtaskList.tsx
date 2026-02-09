import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { Task } from '@/types';

interface SubtaskListProps {
  subtasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string) => Promise<void>;
  onPress?: (id: string) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  onToggle,
  onDelete,
  onAdd,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim()) return;
    await onAdd(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  }, [newTitle, onAdd]);

  const renderSubtask = useCallback(
    ({ item }: { item: Task }) => (
      <View style={styles.subtaskItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggle(item.id)}
        >
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={22}
            color={item.completed ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.subtaskContent}
          onPress={() => onPress?.(item.id)}
          disabled={!onPress}
        >
          <Text
            style={[
              styles.subtaskTitle,
              item.completed && styles.subtaskTitleCompleted,
            ]}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    ),
    [onToggle, onDelete, onPress, colors, styles],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Подзадачи</Text>
        {totalCount > 0 && (
          <Text style={styles.count}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>

      {totalCount > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      )}

      {subtasks.length > 0 ? (
        subtasks.map((item) => (
          <React.Fragment key={item.id}>
            {renderSubtask({ item })}
          </React.Fragment>
        ))
      ) : (
        !isAdding && <Text style={styles.emptyText}>Нет подзадач</Text>
      )}

      {isAdding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Название подзадачи"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <View style={styles.addActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsAdding(false);
                setNewTitle('');
              }}
            >
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !newTitle.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim()}
            >
              <Text style={styles.saveText}>Добавить</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAdding(true)}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Добавить подзадачу</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: colors.text,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    marginRight: SPACING.sm,
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: FONT_SIZES.md,
    color: colors.text,
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    color: colors.primary,
    marginLeft: SPACING.xs,
  },
  addForm: {
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
