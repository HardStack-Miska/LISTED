import { useState, useCallback, useEffect } from 'react';
import { databaseService } from '@/services/database';
import type { Task, Priority } from '@/types';

interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (task: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: Date;
    dueTime?: string;
    projectId?: string;
  }) => Promise<{ id: string }>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
}

export const useTasks = (mode: 'today' | 'upcoming' | 'all' = 'all'): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      await databaseService.initDatabase();

      let loadedTasks: Task[];

      switch (mode) {
        case 'today':
          loadedTasks = await databaseService.getTasksForToday();
          break;
        case 'upcoming':
          loadedTasks = await databaseService.getTasksUpcoming();
          break;
        default:
          loadedTasks = await databaseService.getTasksUpcoming();
      }

      setTasks(loadedTasks);
    } catch (err) {
      setError('Не удалось загрузить задачи');
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (task: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: Date;
    dueTime?: string;
    projectId?: string;
  }) => {
    const result = await databaseService.createTask(task);
    await loadTasks();
    return result;
  }, [loadTasks]);

  const toggleComplete = useCallback(async (id: string) => {
    await databaseService.toggleTaskComplete(id);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date() : undefined,
            }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await databaseService.deleteTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await databaseService.updateTask(id, {
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      dueDate: updates.dueDate ?? null,
      dueTime: updates.dueTime ?? null,
      projectId: updates.projectId ?? null,
    });
    await loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    isLoading,
    error,
    refresh,
    createTask,
    toggleComplete,
    deleteTask,
    updateTask,
  };
};
