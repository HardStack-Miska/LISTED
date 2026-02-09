import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { databaseService } from "@/services/database";
import { getNextOccurrenceDate } from "@/utils/recurrence";
import type { Task, Priority, RecurrenceRule } from "@/types";

interface TaskContextValue {
  allTasks: Task[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  createTask: (task: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: Date;
    dueTime?: string;
    duration?: number;
    projectId?: string;
    labels?: string[];
  }) => Promise<{ id: string }>;
  toggleTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize date to start of day for comparison
  const getDateDay = (date: Date | undefined): number => {
    if (!date) return Infinity;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Sort tasks: by date -> priority -> name
  const sortTasks = useCallback((tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // Completed tasks go to the end
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Sort by due date (normalized to day, tasks without date go last)
      const aDate = getDateDay(a.dueDate);
      const bDate = getDateDay(b.dueDate);
      if (aDate !== bDate) {
        return aDate - bDate;
      }

      // Then by priority (1 is highest, 4 is lowest)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Finally by name (alphabetical)
      return a.title.localeCompare(b.title, "ru");
    });
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      await databaseService.initDatabase();
      // Only load root tasks (not subtasks) - subtasks have parentId
      const loadedTasks = await databaseService.searchTasks({ parentId: null });
      setAllTasks(sortTasks(loadedTasks));
    } catch (err) {
      setError("Не удалось загрузить задачи");
    } finally {
      setIsLoading(false);
    }
  }, [sortTasks]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadTasks();
  }, [loadTasks]);

  const getTodayTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allTasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [allTasks]);

  const getUpcomingTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allTasks
      .filter((task) => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      })
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [allTasks]);

  const createTask = useCallback(
    async (task: {
      title: string;
      description?: string;
      priority?: Priority;
      dueDate?: Date;
      dueTime?: string;
      duration?: number;
      projectId?: string;
      labels?: string[];
    }) => {
      const result = await databaseService.createTask(task);
      // Оптимистичное обновление - добавляем новую задачу и пересортируем
      const newTask: Task = {
        id: result.id,
        title: task.title,
        description: task.description || "",
        priority: task.priority || 4,
        completed: false,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        duration: task.duration,
        projectId: task.projectId,
        labels: task.labels || [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAllTasks((prev) => sortTasks([newTask, ...prev]));
      return result;
    },
    [sortTasks],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = allTasks.find((t) => t.id === id);
      if (!task) return;

      const isCompleting = !task.completed;

      await databaseService.toggleTaskComplete(id);

      // If completing a recurring task, create the next occurrence
      if (isCompleting && task.recurrence && task.dueDate) {
        const nextDueDate = getNextOccurrenceDate(task.dueDate, task.recurrence);

        // Check if we should stop (endDate or endAfterCount)
        const shouldContinue =
          (!task.recurrence.endDate ||
            nextDueDate <= task.recurrence.endDate) &&
          (!task.recurrence.endAfterCount || task.recurrence.endAfterCount > 1);

        if (shouldContinue) {
          const newRecurrence = task.recurrence.endAfterCount
            ? {
                ...task.recurrence,
                endAfterCount: task.recurrence.endAfterCount - 1,
              }
            : task.recurrence;

          const result = await databaseService.createTask({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: nextDueDate,
            dueTime: task.dueTime,
            projectId: task.projectId,
            labels: task.labels,
          });

          // Update recurrence in new task
          await databaseService.updateTask(result.id, {
            recurrence: newRecurrence,
          });

          // Add new task to state
          const newTask: Task = {
            id: result.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            completed: false,
            dueDate: nextDueDate,
            dueTime: task.dueTime,
            projectId: task.projectId,
            labels: task.labels,
            recurrence: newRecurrence,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          setAllTasks((prev) =>
            sortTasks([
              newTask,
              ...prev.map((t) =>
                t.id === id
                  ? { ...t, completed: true, completedAt: new Date() }
                  : t,
              ),
            ]),
          );
          return;
        }
      }

      // Normal toggle without recurrence
      setAllTasks((prev) =>
        sortTasks(
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date() : undefined,
                }
              : t,
          ),
        ),
      );
    },
    [allTasks, sortTasks],
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      // Delegate to toggleTask which handles recurrence
      await toggleTask(id);
    },
    [toggleTask],
  );

  const deleteTask = useCallback(async (id: string) => {
    await databaseService.deleteTask(id);
    setAllTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      await databaseService.updateTask(id, {
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        dueDate: updates.dueDate ?? null,
        dueTime: updates.dueTime ?? null,
        projectId: updates.projectId ?? null,
        recurrence: updates.recurrence ?? null,
      });
      // Оптимистичное обновление с пересортировкой
      setAllTasks((prev) =>
        sortTasks(
          prev.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task,
          ),
        ),
      );
    },
    [sortTasks],
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const value = useMemo(
    () => ({
      allTasks,
      isLoading,
      error,
      refresh,
      getTodayTasks,
      getUpcomingTasks,
      createTask,
      toggleTask,
      toggleComplete,
      deleteTask,
      updateTask,
    }),
    [
      allTasks,
      isLoading,
      error,
      refresh,
      getTodayTasks,
      getUpcomingTasks,
      createTask,
      toggleTask,
      toggleComplete,
      deleteTask,
      updateTask,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = (): TaskContextValue => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
