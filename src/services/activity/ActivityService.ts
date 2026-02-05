import type { ActivityLogEntry, ActivityType, Task } from "@/types";

class ActivityService {
  private static instance: ActivityService;
  private activities: ActivityLogEntry[] = [];
  private maxEntries = 1000; // Unlimited in LISTED (vs 1 week in Todoist free)

  private constructor() {}

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(7);
  }

  log(
    type: ActivityType,
    task?: Partial<Task>,
    details?: Record<string, unknown>,
  ): ActivityLogEntry {
    const entry: ActivityLogEntry = {
      id: this.generateId(),
      type,
      taskId: task?.id,
      taskTitle: task?.title,
      details,
      timestamp: new Date(),
    };

    this.activities.unshift(entry);

    // Keep only last N entries
    if (this.activities.length > this.maxEntries) {
      this.activities = this.activities.slice(0, this.maxEntries);
    }

    return entry;
  }

  // Convenience methods for common actions
  logTaskCreated(task: Task): ActivityLogEntry {
    return this.log("task_created", task);
  }

  logTaskCompleted(task: Task): ActivityLogEntry {
    return this.log("task_completed", task, {
      completedAt: new Date().toISOString(),
    });
  }

  logTaskUncompleted(task: Task): ActivityLogEntry {
    return this.log("task_uncompleted", task);
  }

  logTaskUpdated(
    task: Task,
    changes: Record<string, { old: unknown; new: unknown }>,
  ): ActivityLogEntry {
    return this.log("task_updated", task, { changes });
  }

  logTaskDeleted(task: Task): ActivityLogEntry {
    return this.log("task_deleted", task);
  }

  logTaskMoved(
    task: Task,
    fromProject?: string,
    toProject?: string,
  ): ActivityLogEntry {
    return this.log("task_moved", task, { fromProject, toProject });
  }

  logReminderSet(task: Task, reminderTime: Date): ActivityLogEntry {
    return this.log("reminder_set", task, {
      reminderTime: reminderTime.toISOString(),
    });
  }

  logReminderTriggered(task: Task): ActivityLogEntry {
    return this.log("reminder_triggered", task);
  }

  // Query methods
  getAll(): ActivityLogEntry[] {
    return [...this.activities];
  }

  getByType(type: ActivityType): ActivityLogEntry[] {
    return this.activities.filter((a) => a.type === type);
  }

  getByTask(taskId: string): ActivityLogEntry[] {
    return this.activities.filter((a) => a.taskId === taskId);
  }

  getByDateRange(start: Date, end: Date): ActivityLogEntry[] {
    return this.activities.filter(
      (a) => a.timestamp >= start && a.timestamp <= end,
    );
  }

  getToday(): ActivityLogEntry[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getByDateRange(today, tomorrow);
  }

  getThisWeek(): ActivityLogEntry[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.getByDateRange(weekStart, weekEnd);
  }

  getCompletedCount(start?: Date, end?: Date): number {
    let entries = this.getByType("task_completed");
    if (start && end) {
      entries = entries.filter(
        (a) => a.timestamp >= start && a.timestamp <= end,
      );
    }
    return entries.length;
  }

  // Statistics
  getStats(days: number = 7): {
    totalCompleted: number;
    totalCreated: number;
    completionRate: number;
    mostProductiveDay: string;
    dailyStats: Array<{ date: string; completed: number; created: number }>;
  } {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const rangeEntries = this.getByDateRange(startDate, endDate);
    const completed = rangeEntries.filter((a) => a.type === "task_completed");
    const created = rangeEntries.filter((a) => a.type === "task_created");

    // Daily breakdown - days includes today
    const dailyStats: Map<string, { completed: number; created: number }> =
      new Map();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0]!;
      dailyStats.set(dateStr, { completed: 0, created: 0 });
    }

    completed.forEach((entry) => {
      const dateStr = entry.timestamp.toISOString().split("T")[0]!;
      const stat = dailyStats.get(dateStr);
      if (stat) {
        stat.completed++;
      }
    });

    created.forEach((entry) => {
      const dateStr = entry.timestamp.toISOString().split("T")[0]!;
      const stat = dailyStats.get(dateStr);
      if (stat) {
        stat.created++;
      }
    });

    // Find most productive day
    let maxCompleted = 0;
    let mostProductiveDay = "";
    dailyStats.forEach((stat, date) => {
      if (stat.completed > maxCompleted) {
        maxCompleted = stat.completed;
        mostProductiveDay = date;
      }
    });

    const dailyStatsArray = Array.from(dailyStats.entries()).map(
      ([date, stat]) => ({
        date,
        ...stat,
      }),
    );

    return {
      totalCompleted: completed.length,
      totalCreated: created.length,
      completionRate:
        created.length > 0 ? (completed.length / created.length) * 100 : 0,
      mostProductiveDay,
      dailyStats: dailyStatsArray,
    };
  }

  clear(): void {
    this.activities = [];
  }
}

export const activityService = ActivityService.getInstance();
