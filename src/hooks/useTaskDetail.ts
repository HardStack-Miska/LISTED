import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { databaseService } from '@/services/database';
import { useTaskContext } from '@/contexts';
import { useProjects, useLabels } from '@/hooks';
import { notificationService } from '@/services/notifications';
import type { Task, Priority, RecurrenceRule } from '@/types';

interface UseTaskDetailParams {
  id: string | undefined;
  isNew: boolean;
}

interface TaskFormState {
  title: string;
  description: string;
  priority: Priority;
  dueDate: Date | null;
  dueTime: string | null;
  projectId: string | undefined;
  selectedLabelIds: string[];
  duration: number | undefined;
  recurrence: RecurrenceRule | null;
  reminderMinutes: number | null;
}

interface TaskFormActions {
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setPriority: (value: Priority) => void;
  setDueDate: (value: Date | null) => void;
  setDueTime: (value: string | null) => void;
  setProjectId: (value: string | undefined) => void;
  setDuration: (value: number | undefined) => void;
  setRecurrence: (value: RecurrenceRule | null) => void;
  setReminderMinutes: (value: number | null) => void;
  handleLabelToggle: (labelId: string) => void;
}

interface PickerState {
  showProjectPicker: boolean;
  showLabelPicker: boolean;
  setShowProjectPicker: (value: boolean) => void;
  setShowLabelPicker: (value: boolean) => void;
}

interface UseTaskDetailResult {
  task: Task | null;
  subtasks: Task[];
  isLoading: boolean;
  isSaving: boolean;
  form: TaskFormState & TaskFormActions;
  pickers: PickerState;
  projects: ReturnType<typeof useProjects>['projects'];
  labels: ReturnType<typeof useLabels>['labels'];
  refreshProjects: () => Promise<void>;
  refreshLabels: () => Promise<void>;
  performSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleCreate: () => Promise<void>;
  handleAddSubtask: (title: string) => Promise<void>;
  handleToggleSubtask: (subtaskId: string) => Promise<void>;
  handleDeleteSubtask: (subtaskId: string) => Promise<void>;
  hasUnsavedChanges: () => boolean;
}

export const useTaskDetail = ({
  id,
  isNew,
}: UseTaskDetailParams): UseTaskDetailResult => {
  const {
    createTask,
    updateTask,
    deleteTask: contextDeleteTask,
  } = useTaskContext();
  const { projects, refresh: refreshProjects } = useProjects();
  const {
    labels,
    addLabelToTask,
    removeLabelFromTask,
    refresh: refreshLabels,
  } = useLabels();

  // Core state
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(4);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [duration, setDuration] = useState<number | undefined>();
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);

  // Picker visibility
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // Change tracking
  const isInitialLoadRef = useRef(true);
  const hasChangesRef = useRef(false);

  // Load task data
  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
      return;
    }

    const loadTask = async () => {
      if (!id) return;

      try {
        const loadedTask = await databaseService.getTask(id);
        if (loadedTask) {
          setTask(loadedTask);
          setTitle(loadedTask.title);
          setDescription(loadedTask.description ?? '');
          setPriority(loadedTask.priority);
          setDueDate(loadedTask.dueDate ?? null);
          setDueTime(loadedTask.dueTime ?? null);
          setProjectId(loadedTask.projectId);
          setSelectedLabelIds(loadedTask.labels);
          setDuration(loadedTask.duration);
          setRecurrence(loadedTask.recurrence ?? null);
        }

        const loadedSubtasks = await databaseService.getSubtasks(id);
        setSubtasks(loadedSubtasks);
      } catch {
        Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadTask();
  }, [id, isNew]);

  // Track changes after initial load
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    hasChangesRef.current = true;
  }, [
    title,
    description,
    priority,
    dueDate,
    dueTime,
    duration,
    projectId,
    selectedLabelIds,
    recurrence,
    reminderMinutes,
  ]);

  const hasUnsavedChanges = useCallback(() => {
    return hasChangesRef.current;
  }, []);

  // Save existing task
  const performSave = useCallback(async () => {
    if (isNew || !id || !title.trim() || !hasChangesRef.current) return;

    setIsSaving(true);
    try {
      await updateTask(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ?? undefined,
        dueTime: dueTime ?? undefined,
        duration,
        projectId: projectId,
        recurrence: recurrence ?? undefined,
      });

      // Update labels
      const currentLabels = task?.labels ?? [];
      const toAdd = selectedLabelIds.filter(
        (l) => !currentLabels.includes(l),
      );
      const toRemove = currentLabels.filter(
        (l) => !selectedLabelIds.includes(l),
      );

      for (const labelId of toAdd) {
        await addLabelToTask(id, labelId);
      }
      for (const labelId of toRemove) {
        await removeLabelFromTask(id, labelId);
      }

      // Schedule notification reminder if set
      if (reminderMinutes !== null && dueDate) {
        await notificationService.cancelAllTaskReminders(id);
        const taskForReminder: Task = {
          id,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ?? undefined,
          dueTime: dueTime ?? undefined,
          completed: false,
          labels: selectedLabelIds,
          order: 0,
          createdAt: task?.createdAt ?? new Date(),
          updatedAt: new Date(),
        };
        if (reminderMinutes === 0) {
          await notificationService.scheduleTaskReminder(
            taskForReminder,
            dueDate,
            `${id}_reminder`,
          );
        } else {
          await notificationService.scheduleRelativeReminder(
            taskForReminder,
            reminderMinutes,
            `${id}_reminder`,
          );
        }
      } else if (reminderMinutes === null && id) {
        await notificationService.cancelAllTaskReminders(id);
      }

      // Update local task state
      setTask((prev) =>
        prev ? { ...prev, labels: selectedLabelIds } : null,
      );
      hasChangesRef.current = false;
    } catch {
      // Save failed silently
    } finally {
      setIsSaving(false);
    }
  }, [
    isNew,
    id,
    title,
    description,
    priority,
    dueDate,
    dueTime,
    duration,
    projectId,
    selectedLabelIds,
    reminderMinutes,
    recurrence,
    task,
    updateTask,
    addLabelToTask,
    removeLabelFromTask,
  ]);

  // Delete task
  const handleDelete = useCallback(async () => {
    if (!id) return;

    try {
      await contextDeleteTask(id);
    } catch {
      Alert.alert('Ошибка', 'Не удалось удалить задачу');
    }
  }, [id, contextDeleteTask]);

  // Create new task
  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const result = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ?? undefined,
        dueTime: dueTime ?? undefined,
        duration,
        projectId: projectId,
        labels: selectedLabelIds,
      });
      if (recurrence) {
        await updateTask(result.id, { recurrence });
      }
      for (const labelId of selectedLabelIds) {
        await addLabelToTask(result.id, labelId);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать задачу');
      throw new Error('Create failed');
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    description,
    priority,
    dueDate,
    dueTime,
    duration,
    projectId,
    selectedLabelIds,
    recurrence,
    createTask,
    updateTask,
    addLabelToTask,
  ]);

  // Subtask operations
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
      } catch {
        // Subtask creation failed
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
    } catch {
      // Toggle failed
    }
  }, []);

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      await databaseService.deleteTask(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch {
      // Delete failed
    }
  }, []);

  // Label toggle
  const handleLabelToggle = useCallback((labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((lid) => lid !== labelId)
        : [...prev, labelId],
    );
  }, []);

  return {
    task,
    subtasks,
    isLoading,
    isSaving,
    form: {
      title,
      description,
      priority,
      dueDate,
      dueTime,
      projectId,
      selectedLabelIds,
      duration,
      recurrence,
      reminderMinutes,
      setTitle,
      setDescription,
      setPriority,
      setDueDate,
      setDueTime,
      setProjectId,
      setDuration,
      setRecurrence,
      setReminderMinutes,
      handleLabelToggle,
    },
    pickers: {
      showProjectPicker,
      showLabelPicker,
      setShowProjectPicker,
      setShowLabelPicker,
    },
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
  };
};
