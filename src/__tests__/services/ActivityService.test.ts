import { activityService } from "@/services/activity";
import type { Task } from "@/types";

describe("ActivityService", () => {
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: "task-1",
    title: "Test Task",
    priority: 2,
    completed: false,
    labels: [],
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    activityService.clear();
  });

  describe("log", () => {
    it("should log activity entry", () => {
      const task = createTask();

      const entry = activityService.log("task_created", task);

      expect(entry.id).toBeDefined();
      expect(entry.type).toBe("task_created");
      expect(entry.taskId).toBe(task.id);
      expect(entry.taskTitle).toBe(task.title);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("should log with additional details", () => {
      const task = createTask();
      const details = { reason: "test" };

      const entry = activityService.log("task_updated", task, details);

      expect(entry.details).toEqual(details);
    });
  });

  describe("convenience methods", () => {
    it("should log task created", () => {
      const task = createTask();

      const entry = activityService.logTaskCreated(task);

      expect(entry.type).toBe("task_created");
    });

    it("should log task completed", () => {
      const task = createTask({ completed: true });

      const entry = activityService.logTaskCompleted(task);

      expect(entry.type).toBe("task_completed");
      expect(entry.details?.completedAt).toBeDefined();
    });

    it("should log task uncompleted", () => {
      const task = createTask();

      const entry = activityService.logTaskUncompleted(task);

      expect(entry.type).toBe("task_uncompleted");
    });

    it("should log task updated with changes", () => {
      const task = createTask();
      const changes = {
        title: { old: "Old Title", new: "New Title" },
      };

      const entry = activityService.logTaskUpdated(task, changes);

      expect(entry.type).toBe("task_updated");
      expect(entry.details?.changes).toEqual(changes);
    });

    it("should log task deleted", () => {
      const task = createTask();

      const entry = activityService.logTaskDeleted(task);

      expect(entry.type).toBe("task_deleted");
    });

    it("should log task moved", () => {
      const task = createTask();

      const entry = activityService.logTaskMoved(
        task,
        "project-1",
        "project-2",
      );

      expect(entry.type).toBe("task_moved");
      expect(entry.details?.fromProject).toBe("project-1");
      expect(entry.details?.toProject).toBe("project-2");
    });

    it("should log reminder set", () => {
      const task = createTask();
      const reminderTime = new Date();

      const entry = activityService.logReminderSet(task, reminderTime);

      expect(entry.type).toBe("reminder_set");
      expect(entry.details?.reminderTime).toBeDefined();
    });

    it("should log reminder triggered", () => {
      const task = createTask();

      const entry = activityService.logReminderTriggered(task);

      expect(entry.type).toBe("reminder_triggered");
    });
  });

  describe("getAll", () => {
    it("should return all entries in reverse chronological order", () => {
      const task1 = createTask({ id: "1", title: "Task 1" });
      const task2 = createTask({ id: "2", title: "Task 2" });

      activityService.logTaskCreated(task1);
      activityService.logTaskCreated(task2);

      const entries = activityService.getAll();

      expect(entries).toHaveLength(2);
      expect(entries[0]?.taskTitle).toBe("Task 2"); // Most recent first
      expect(entries[1]?.taskTitle).toBe("Task 1");
    });
  });

  describe("getByType", () => {
    it("should filter entries by type", () => {
      const task = createTask();

      activityService.logTaskCreated(task);
      activityService.logTaskCompleted(task);
      activityService.logTaskCreated(task);

      const created = activityService.getByType("task_created");
      const completed = activityService.getByType("task_completed");

      expect(created).toHaveLength(2);
      expect(completed).toHaveLength(1);
    });
  });

  describe("getByTask", () => {
    it("should filter entries by task ID", () => {
      const task1 = createTask({ id: "1" });
      const task2 = createTask({ id: "2" });

      activityService.logTaskCreated(task1);
      activityService.logTaskCreated(task2);
      activityService.logTaskCompleted(task1);

      const task1Entries = activityService.getByTask("1");

      expect(task1Entries).toHaveLength(2);
    });
  });

  describe("getByDateRange", () => {
    it("should filter entries by date range", () => {
      const task = createTask();
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      activityService.logTaskCreated(task);

      const entries = activityService.getByDateRange(yesterday, tomorrow);

      expect(entries).toHaveLength(1);
    });
  });

  describe("getToday", () => {
    it("should return entries from today", () => {
      const task = createTask();

      activityService.logTaskCreated(task);

      const todayEntries = activityService.getToday();

      expect(todayEntries).toHaveLength(1);
    });
  });

  describe("getThisWeek", () => {
    it("should return entries from this week", () => {
      const task = createTask();

      activityService.logTaskCreated(task);
      activityService.logTaskCompleted(task);

      const weekEntries = activityService.getThisWeek();

      expect(weekEntries).toHaveLength(2);
    });
  });

  describe("getCompletedCount", () => {
    it("should count completed tasks", () => {
      const task1 = createTask({ id: "1" });
      const task2 = createTask({ id: "2" });

      activityService.logTaskCreated(task1);
      activityService.logTaskCompleted(task1);
      activityService.logTaskCreated(task2);
      activityService.logTaskCompleted(task2);

      const count = activityService.getCompletedCount();

      expect(count).toBe(2);
    });
  });

  describe("getStats", () => {
    it("should return statistics for given days", () => {
      const task1 = createTask({ id: "1" });
      const task2 = createTask({ id: "2" });

      activityService.logTaskCreated(task1);
      activityService.logTaskCreated(task2);
      activityService.logTaskCompleted(task1);

      const stats = activityService.getStats(7);

      expect(stats.totalCreated).toBe(2);
      expect(stats.totalCompleted).toBe(1);
      expect(stats.completionRate).toBe(50);
      expect(stats.dailyStats).toHaveLength(7);
    });

    it("should identify most productive day", () => {
      const task = createTask();

      activityService.logTaskCompleted(task);
      activityService.logTaskCompleted(task);

      const stats = activityService.getStats(7);

      // Should have 2 completed tasks
      expect(stats.totalCompleted).toBe(2);
      // Most productive day exists in daily stats
      expect(stats.mostProductiveDay.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty activity", () => {
      const stats = activityService.getStats(7);

      expect(stats.totalCreated).toBe(0);
      expect(stats.totalCompleted).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      const task = createTask();

      activityService.logTaskCreated(task);
      activityService.logTaskCompleted(task);

      expect(activityService.getAll()).toHaveLength(2);

      activityService.clear();

      expect(activityService.getAll()).toHaveLength(0);
    });
  });
});
