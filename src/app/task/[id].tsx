import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import { useTaskDetail } from '@/hooks';
import { SubtaskList } from '@/components/tasks/SubtaskList';
import { DatePicker } from '@/components/tasks/DatePicker';
import { PriorityPicker } from '@/components/tasks/PriorityPicker';
import { RecurrencePicker } from '@/components/tasks/RecurrencePicker';
import { ReminderPicker } from '@/components/tasks/ReminderPicker';
import { TimePicker } from '@/components/tasks/TimePicker';
import { DurationPicker } from '@/components/tasks/DurationPicker';
import { ProjectPicker, ProjectPickerInline } from '@/components/projects';
import { LabelPicker, LabelPickerInline } from '@/components/labels';
import { HoldToDeleteButton } from '@/components/ui/HoldToDeleteButton';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isNewTask = id === 'new';

  const {
    task,
    subtasks,
    isLoading,
    isSaving,
    form,
    pickers,
    projects,
    labels,
    refreshProjects,
    refreshLabels,
    performSave,
    handleDelete,
    handleCreate,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    hasUnsavedChanges,
  } = useTaskDetail({ id, isNew: isNewTask });

  const handleBack = useCallback(async () => {
    if (isNewTask) {
      router.back();
      return;
    }
    if (hasUnsavedChanges()) {
      await performSave();
    }
    router.back();
  }, [isNewTask, performSave, hasUnsavedChanges, router]);

  const onDelete = useCallback(async () => {
    await handleDelete();
    router.back();
  }, [handleDelete, router]);

  const onCreate = useCallback(async () => {
    try {
      await handleCreate();
      router.back();
    } catch {
      // Create failed, alert already shown by hook
    }
  }, [handleCreate, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!task && !isNewTask) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textSecondary}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {isNewTask ? (
          <>
            <Text style={styles.headerTitle}>Новая задача</Text>
            <View style={styles.headerSpacer} />
          </>
        ) : (
          isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.savingText}>Сохранение...</Text>
            </View>
          )
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          value={form.title}
          onChangeText={form.setTitle}
          placeholder="Название задачи"
          placeholderTextColor={colors.textSecondary}
          autoFocus={isNewTask}
          returnKeyType="done"
          blurOnSubmit
        />

        <TextInput
          style={styles.descriptionInput}
          value={form.description}
          onChangeText={form.setDescription}
          placeholder="Добавить описание..."
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
        />

        {/* Order matches QuickAddTask: Date -> Priority -> Project -> Labels */}
        <View style={styles.section}>
          <View style={styles.dateSection}>
            <View style={styles.dateLabelRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>Дата</Text>
            </View>
            <DatePicker value={form.dueDate} onChange={form.setDueDate} />
            {form.dueDate && (
              <TimePicker value={form.dueTime} onChange={form.setDueTime} />
            )}
            {form.dueTime && (
              <DurationPicker
                value={form.duration}
                onChange={form.setDuration}
              />
            )}
          </View>

          <PriorityPicker
            value={form.priority}
            onChange={form.setPriority}
          />

          <ProjectPickerInline
            projects={projects}
            selectedId={form.projectId}
            onPress={() => pickers.setShowProjectPicker(true)}
          />

          <LabelPickerInline
            labels={labels}
            selectedIds={form.selectedLabelIds}
            onPress={() => pickers.setShowLabelPicker(true)}
          />

          <RecurrencePicker
            value={form.recurrence}
            onChange={form.setRecurrence}
          />

          {form.recurrence !== null && !isNewTask && (
            <TouchableOpacity
              style={styles.removeRecurrence}
              onPress={() => {
                Alert.alert(
                  'Убрать повторение?',
                  'Повторение будет отключено. Уже завершённые задачи останутся.',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Убрать',
                      style: 'destructive',
                      onPress: () => form.setRecurrence(null),
                    },
                  ],
                );
              }}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.error}
              />
              <Text style={styles.removeRecurrenceText}>
                Убрать повторение
              </Text>
            </TouchableOpacity>
          )}

          <ReminderPicker
            value={form.reminderMinutes}
            onChange={form.setReminderMinutes}
            hasDueDate={form.dueDate !== null}
          />
        </View>

        {!isNewTask && (
          <View style={styles.section}>
            <SubtaskList
              subtasks={subtasks}
              onToggle={handleToggleSubtask}
              onDelete={handleDeleteSubtask}
              onAdd={handleAddSubtask}
            />
          </View>
        )}

        {!isNewTask && (
          <View style={styles.deleteSection}>
            <HoldToDeleteButton onDelete={onDelete} />
          </View>
        )}
      </ScrollView>

      {isNewTask && (
        <View style={styles.createFooter}>
          <TouchableOpacity
            style={[
              styles.createButton,
              !form.title.trim() && styles.createButtonDisabled,
            ]}
            onPress={onCreate}
            disabled={!form.title.trim()}
          >
            <Text style={styles.createButtonText}>Создать задачу</Text>
          </TouchableOpacity>
        </View>
      )}

      <ProjectPicker
        visible={pickers.showProjectPicker}
        projects={projects}
        selectedId={form.projectId}
        onSelect={form.setProjectId}
        onClose={() => {
          pickers.setShowProjectPicker(false);
          refreshProjects();
        }}
      />

      <LabelPicker
        visible={pickers.showLabelPicker}
        labels={labels}
        selectedIds={form.selectedLabelIds}
        onToggle={form.handleLabelToggle}
        onClose={() => {
          pickers.setShowLabelPicker(false);
          refreshLabels();
        }}
      />
    </SafeAreaView>
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: SPACING.xl,
    },
    errorText: {
      fontSize: FONT_SIZES.lg,
      color: colors.text,
      marginTop: SPACING.md,
    },
    backButtonError: {
      marginTop: SPACING.lg,
      padding: SPACING.md,
    },
    backButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: SPACING.sm,
    },
    savingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      paddingRight: SPACING.sm,
    },
    savingText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: SPACING.md,
    },
    titleInput: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '600',
      color: colors.text,
      padding: 0,
      marginBottom: SPACING.md,
    },
    descriptionInput: {
      fontSize: FONT_SIZES.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: SPACING.md,
      minHeight: 80,
      marginBottom: SPACING.lg,
    },
    section: {
      marginBottom: SPACING.lg,
      gap: SPACING.sm,
    },
    fieldLabel: {
      fontSize: FONT_SIZES.md,
      color: colors.text,
    },
    dateSection: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: 12,
    },
    dateLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    deleteSection: {
      marginTop: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    headerTitle: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 48,
    },
    createFooter: {
      padding: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      borderRadius: 12,
      alignItems: 'center',
    },
    createButtonDisabled: {
      backgroundColor: colors.border,
    },
    createButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.white,
    },
    removeRecurrence: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    removeRecurrenceText: {
      fontSize: FONT_SIZES.sm,
      color: colors.error,
      marginLeft: SPACING.xs,
    },
  });
