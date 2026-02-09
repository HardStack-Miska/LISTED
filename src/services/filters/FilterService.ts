import type {
  Task,
  CustomFilter,
  FilterCondition,
  FilterComparator,
} from "@/types";

class FilterService {
  private static instance: FilterService;

  private constructor() {}

  static getInstance(): FilterService {
    if (!FilterService.instance) {
      FilterService.instance = new FilterService();
    }
    return FilterService.instance;
  }

  applyFilter(tasks: Task[], filter: CustomFilter): Task[] {
    if (filter.conditions.length === 0) {
      return tasks;
    }

    return tasks.filter((task) => {
      const results = filter.conditions.map((condition) =>
        this.evaluateCondition(task, condition)
      );

      if (filter.operator === "and") {
        return results.every((r) => r);
      } else {
        return results.some((r) => r);
      }
    });
  }

  private evaluateCondition(task: Task, condition: FilterCondition): boolean {
    switch (condition.type) {
      case "priority":
        return this.evaluatePriority(task, condition);
      case "dueDate":
        return this.evaluateDueDate(task, condition);
      case "label":
        return this.evaluateLabel(task, condition);
      case "project":
        return this.evaluateProject(task, condition);
      case "completed":
        return this.evaluateCompleted(task, condition);
      case "hasReminder":
        return this.evaluateHasReminder(task, condition);
      case "isRecurring":
        return this.evaluateIsRecurring(task, condition);
      case "hasDuration":
        return this.evaluateHasDuration(task, condition);
      default:
        return true;
    }
  }

  private evaluatePriority(task: Task, condition: FilterCondition): boolean {
    const value = condition.value as number;

    switch (condition.comparator) {
      case "equals":
        return task.priority === value;
      case "notEquals":
        return task.priority !== value;
      case "greaterThan":
        return task.priority < value; // Lower number = higher priority
      case "lessThan":
        return task.priority > value;
      default:
        return true;
    }
  }

  private evaluateDueDate(task: Task, condition: FilterCondition): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = task.dueDate ? new Date(task.dueDate) : null;
    if (taskDate) {
      taskDate.setHours(0, 0, 0, 0);
    }

    switch (condition.comparator) {
      case "today":
        return taskDate !== null && taskDate.getTime() === today.getTime();

      case "thisWeek": {
        if (!taskDate) return false;
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return taskDate >= today && taskDate < weekEnd;
      }

      case "overdue":
        return taskDate !== null && taskDate < today && !task.completed;

      case "noDate":
        return taskDate === null;

      case "before": {
        if (!taskDate || !condition.value) return false;
        const beforeDate = new Date(condition.value as Date);
        beforeDate.setHours(0, 0, 0, 0);
        return taskDate < beforeDate;
      }

      case "after": {
        if (!taskDate || !condition.value) return false;
        const afterDate = new Date(condition.value as Date);
        afterDate.setHours(0, 0, 0, 0);
        return taskDate > afterDate;
      }

      case "equals": {
        if (!taskDate || !condition.value) return false;
        const equalDate = new Date(condition.value as Date);
        equalDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === equalDate.getTime();
      }

      default:
        return true;
    }
  }

  private evaluateLabel(task: Task, condition: FilterCondition): boolean {
    const labelId = condition.value as string;

    switch (condition.comparator) {
      case "contains":
        return task.labels.includes(labelId);
      case "notEquals":
        return !task.labels.includes(labelId);
      default:
        return true;
    }
  }

  private evaluateProject(task: Task, condition: FilterCondition): boolean {
    const projectId = condition.value as string;

    switch (condition.comparator) {
      case "equals":
        return task.projectId === projectId;
      case "notEquals":
        return task.projectId !== projectId;
      default:
        return true;
    }
  }

  private evaluateCompleted(task: Task, condition: FilterCondition): boolean {
    const value = condition.value as boolean;
    return task.completed === value;
  }

  private evaluateHasReminder(task: Task, condition: FilterCondition): boolean {
    const hasReminders = task.reminders && task.reminders.length > 0;
    const value = condition.value as boolean;
    return hasReminders === value;
  }

  private evaluateIsRecurring(task: Task, condition: FilterCondition): boolean {
    const isRecurring = task.recurrence !== undefined;
    const value = condition.value as boolean;
    return isRecurring === value;
  }

  private evaluateHasDuration(task: Task, condition: FilterCondition): boolean {
    const hasDuration = task.duration !== undefined && task.duration > 0;
    const value = condition.value as boolean;
    return hasDuration === value;
  }

  // Preset filters
  getPresetFilters(): CustomFilter[] {
    const now = new Date();
    return [
      {
        id: "preset-today",
        name: "Сегодня",
        color: "#4caf50",
        conditions: [
          {
            id: "c1",
            type: "dueDate",
            comparator: "today",
          },
        ],
        operator: "and",
        isFavorite: true,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "preset-overdue",
        name: "Просроченные",
        color: "#f44336",
        conditions: [
          {
            id: "c1",
            type: "dueDate",
            comparator: "overdue",
          },
        ],
        operator: "and",
        isFavorite: true,
        order: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "preset-high-priority",
        name: "Высокий приоритет",
        color: "#d1453b",
        conditions: [
          {
            id: "c1",
            type: "priority",
            comparator: "equals",
            value: 1,
          },
        ],
        operator: "and",
        isFavorite: false,
        order: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "preset-this-week",
        name: "На этой неделе",
        color: "#2196f3",
        conditions: [
          {
            id: "c1",
            type: "dueDate",
            comparator: "thisWeek",
          },
        ],
        operator: "and",
        isFavorite: false,
        order: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "preset-no-date",
        name: "Без даты",
        color: "#9e9e9e",
        conditions: [
          {
            id: "c1",
            type: "dueDate",
            comparator: "noDate",
          },
        ],
        operator: "and",
        isFavorite: false,
        order: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "preset-recurring",
        name: "Повторяющиеся",
        color: "#9c27b0",
        conditions: [
          {
            id: "c1",
            type: "isRecurring",
            comparator: "equals",
            value: true,
          },
        ],
        operator: "and",
        isFavorite: false,
        order: 5,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // Generate filter query description
  getFilterDescription(filter: CustomFilter): string {
    if (filter.conditions.length === 0) {
      return "Все задачи";
    }

    const descriptions = filter.conditions.map((c) =>
      this.getConditionDescription(c)
    );
    const connector = filter.operator === "and" ? " И " : " ИЛИ ";
    return descriptions.join(connector);
  }

  private getConditionDescription(condition: FilterCondition): string {
    const comparatorLabels: Record<FilterComparator, string> = {
      equals: "равно",
      notEquals: "не равно",
      greaterThan: "больше",
      lessThan: "меньше",
      contains: "содержит",
      before: "до",
      after: "после",
      today: "сегодня",
      thisWeek: "на этой неделе",
      overdue: "просрочено",
      noDate: "без даты",
    };

    const typeLabels: Record<string, string> = {
      priority: "Приоритет",
      dueDate: "Дата",
      label: "Метка",
      project: "Проект",
      completed: "Завершено",
      hasReminder: "С напоминанием",
      isRecurring: "Повторяющаяся",
      hasDuration: "С длительностью",
    };

    const typeLabel = typeLabels[condition.type] ?? condition.type;
    const comparatorLabel =
      comparatorLabels[condition.comparator] ?? condition.comparator;

    if (
      condition.comparator === "today" ||
      condition.comparator === "thisWeek" ||
      condition.comparator === "overdue" ||
      condition.comparator === "noDate"
    ) {
      return `${typeLabel} ${comparatorLabel}`;
    }

    return `${typeLabel} ${comparatorLabel} ${condition.value ?? ""}`;
  }
}

export const filterService = FilterService.getInstance();
