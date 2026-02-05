import { filterService } from "@/services/filters";
import type { Task, CustomFilter, FilterCondition } from "@/types";

describe("FilterService", () => {
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

  const createFilter = (
    conditions: FilterCondition[],
    operator: "and" | "or" = "and"
  ): CustomFilter => ({
    id: "filter-1",
    name: "Test Filter",
    color: "#dc4c3e",
    conditions,
    operator,
    isFavorite: false,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe("applyFilter", () => {
    it("should return all tasks when filter has no conditions", () => {
      const tasks = [createTask({ id: "1" }), createTask({ id: "2" })];
      const filter = createFilter([]);

      const result = filterService.applyFilter(tasks, filter);

      expect(result).toHaveLength(2);
    });

    describe("priority filter", () => {
      it("should filter tasks by priority equals", () => {
        const tasks = [
          createTask({ id: "1", priority: 1 }),
          createTask({ id: "2", priority: 2 }),
          createTask({ id: "3", priority: 1 }),
        ];
        const filter = createFilter([
          { id: "c1", type: "priority", comparator: "equals", value: 1 },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
        expect(result.every((t) => t.priority === 1)).toBe(true);
      });

      it("should filter tasks by priority not equals", () => {
        const tasks = [
          createTask({ id: "1", priority: 1 }),
          createTask({ id: "2", priority: 2 }),
          createTask({ id: "3", priority: 3 }),
        ];
        const filter = createFilter([
          { id: "c1", type: "priority", comparator: "notEquals", value: 1 },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
        expect(result.every((t) => t.priority !== 1)).toBe(true);
      });
    });

    describe("dueDate filter", () => {
      it("should filter tasks due today", () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasks = [
          createTask({ id: "1", dueDate: today }),
          createTask({ id: "2", dueDate: tomorrow }),
          createTask({ id: "3" }), // no due date
        ];
        const filter = createFilter([
          { id: "c1", type: "dueDate", comparator: "today" },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });

      it("should filter tasks due this week", () => {
        const today = new Date();
        const inThreeDays = new Date(today);
        inThreeDays.setDate(inThreeDays.getDate() + 3);
        const inTwoWeeks = new Date(today);
        inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

        const tasks = [
          createTask({ id: "1", dueDate: today }),
          createTask({ id: "2", dueDate: inThreeDays }),
          createTask({ id: "3", dueDate: inTwoWeeks }),
        ];
        const filter = createFilter([
          { id: "c1", type: "dueDate", comparator: "thisWeek" },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
      });

      it("should filter overdue tasks", () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasks = [
          createTask({ id: "1", dueDate: yesterday, completed: false }),
          createTask({ id: "2", dueDate: yesterday, completed: true }),
          createTask({ id: "3", dueDate: tomorrow }),
        ];
        const filter = createFilter([
          { id: "c1", type: "dueDate", comparator: "overdue" },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });

      it("should filter tasks with no date", () => {
        const today = new Date();

        const tasks = [
          createTask({ id: "1", dueDate: today }),
          createTask({ id: "2" }),
          createTask({ id: "3" }),
        ];
        const filter = createFilter([
          { id: "c1", type: "dueDate", comparator: "noDate" },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
      });
    });

    describe("completed filter", () => {
      it("should filter completed tasks", () => {
        const tasks = [
          createTask({ id: "1", completed: true }),
          createTask({ id: "2", completed: false }),
          createTask({ id: "3", completed: true }),
        ];
        const filter = createFilter([
          { id: "c1", type: "completed", comparator: "equals", value: true },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
        expect(result.every((t) => t.completed)).toBe(true);
      });

      it("should filter incomplete tasks", () => {
        const tasks = [
          createTask({ id: "1", completed: true }),
          createTask({ id: "2", completed: false }),
        ];
        const filter = createFilter([
          { id: "c1", type: "completed", comparator: "equals", value: false },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.completed).toBe(false);
      });
    });

    describe("hasReminder filter", () => {
      it("should filter tasks with reminders", () => {
        const tasks = [
          createTask({
            id: "1",
            reminders: [
              {
                id: "r1",
                taskId: "1",
                time: new Date(),
                type: "absolute",
                triggered: false,
              },
            ],
          }),
          createTask({ id: "2", reminders: [] }),
          createTask({ id: "3" }),
        ];
        const filter = createFilter([
          { id: "c1", type: "hasReminder", comparator: "equals", value: true },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });
    });

    describe("isRecurring filter", () => {
      it("should filter recurring tasks", () => {
        const tasks = [
          createTask({
            id: "1",
            recurrence: { type: "daily", interval: 1 },
          }),
          createTask({ id: "2" }),
        ];
        const filter = createFilter([
          { id: "c1", type: "isRecurring", comparator: "equals", value: true },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });
    });

    describe("hasDuration filter", () => {
      it("should filter tasks with duration", () => {
        const tasks = [
          createTask({ id: "1", duration: 30 }),
          createTask({ id: "2", duration: 0 }),
          createTask({ id: "3" }),
        ];
        const filter = createFilter([
          { id: "c1", type: "hasDuration", comparator: "equals", value: true },
        ]);

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });
    });

    describe("operator logic", () => {
      it("should apply AND logic - all conditions must match", () => {
        const tasks = [
          createTask({ id: "1", priority: 1, completed: false }),
          createTask({ id: "2", priority: 1, completed: true }),
          createTask({ id: "3", priority: 2, completed: false }),
        ];
        const filter = createFilter(
          [
            { id: "c1", type: "priority", comparator: "equals", value: 1 },
            { id: "c2", type: "completed", comparator: "equals", value: false },
          ],
          "and"
        );

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("1");
      });

      it("should apply OR logic - any condition can match", () => {
        const tasks = [
          createTask({ id: "1", priority: 1, completed: false }),
          createTask({ id: "2", priority: 2, completed: true }),
          createTask({ id: "3", priority: 3, completed: false }),
        ];
        const filter = createFilter(
          [
            { id: "c1", type: "priority", comparator: "equals", value: 1 },
            { id: "c2", type: "completed", comparator: "equals", value: true },
          ],
          "or"
        );

        const result = filterService.applyFilter(tasks, filter);

        expect(result).toHaveLength(2);
      });
    });
  });

  describe("getPresetFilters", () => {
    it("should return preset filters", () => {
      const presets = filterService.getPresetFilters();

      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some((p) => p.name === "Сегодня")).toBe(true);
      expect(presets.some((p) => p.name === "Просроченные")).toBe(true);
      expect(presets.some((p) => p.name === "Высокий приоритет")).toBe(true);
    });

    it("should have valid filter structure", () => {
      const presets = filterService.getPresetFilters();

      presets.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.color).toBeDefined();
        expect(preset.conditions).toBeDefined();
        expect(Array.isArray(preset.conditions)).toBe(true);
      });
    });
  });

  describe("getFilterDescription", () => {
    it("should return description for empty filter", () => {
      const filter = createFilter([]);

      const description = filterService.getFilterDescription(filter);

      expect(description).toBe("Все задачи");
    });

    it("should return description for single condition", () => {
      const filter = createFilter([
        { id: "c1", type: "dueDate", comparator: "today" },
      ]);

      const description = filterService.getFilterDescription(filter);

      expect(description).toContain("Дата");
      expect(description).toContain("сегодня");
    });

    it("should join multiple conditions with AND", () => {
      const filter = createFilter(
        [
          { id: "c1", type: "priority", comparator: "equals", value: 1 },
          { id: "c2", type: "dueDate", comparator: "today" },
        ],
        "and"
      );

      const description = filterService.getFilterDescription(filter);

      expect(description).toContain(" И ");
    });

    it("should join multiple conditions with OR", () => {
      const filter = createFilter(
        [
          { id: "c1", type: "priority", comparator: "equals", value: 1 },
          { id: "c2", type: "dueDate", comparator: "today" },
        ],
        "or"
      );

      const description = filterService.getFilterDescription(filter);

      expect(description).toContain(" ИЛИ ");
    });
  });
});
