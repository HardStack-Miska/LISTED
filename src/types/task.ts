// Task types for Todoist-like functionality

export type Priority = 1 | 2 | 3 | 4;

// Recurrence pattern for recurring tasks
export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number; // every N days/weeks/months/years
  daysOfWeek?: number[]; // 0-6 for weekly (0=Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: Date; // when to stop recurring
  endAfterCount?: number; // stop after N occurrences
}

// Reminder settings
export interface Reminder {
  id: string;
  taskId: string;
  time: Date;
  type: "absolute" | "relative";
  relativeMinutes?: number; // minutes before due time
  notificationId?: string; // expo notification ID
  triggered: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: Date;
  dueTime?: string; // "HH:mm" format
  completed: boolean;
  completedAt?: Date;
  projectId?: string;
  parentId?: string; // for subtasks
  sourcePageId?: string; // for inline tasks - link to the page where task was created
  sourceBlockId?: string; // for inline tasks - link to the block
  labels: string[];
  order: number;
  // Premium features (free in LISTED)
  duration?: number; // estimated duration in minutes
  recurrence?: RecurrenceRule;
  reminders?: Reminder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilter {
  projectId?: string;
  labelId?: string;
  priority?: Priority;
  completed?: boolean;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  search?: string;
}

// Advanced search filters for Sprint 5
export interface SearchFilters {
  query?: string;
  projectId?: string;
  labelIds?: string[];
  priority?: Priority;
  completed?: boolean;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  hasReminder?: boolean;
  isRecurring?: boolean;
  parentId?: string | null; // null = only root tasks, undefined = all, string = subtasks of task
  limit?: number;
  offset?: number;
}

export interface TaskGroup {
  title: string;
  tasks: Task[];
}

// Custom Filter - premium feature (free in LISTED)
export type FilterOperator = "and" | "or";
export type FilterConditionType =
  | "priority"
  | "dueDate"
  | "label"
  | "project"
  | "completed"
  | "hasReminder"
  | "isRecurring"
  | "hasDuration";

export type FilterComparator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "contains"
  | "before"
  | "after"
  | "today"
  | "thisWeek"
  | "overdue"
  | "noDate";

export interface FilterCondition {
  id: string;
  type: FilterConditionType;
  comparator: FilterComparator;
  value?: string | number | boolean | Date;
}

export interface CustomFilter {
  id: string;
  name: string;
  color: string;
  icon?: string;
  conditions: FilterCondition[];
  operator: FilterOperator; // how conditions are combined
  isFavorite: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Activity History - premium feature (free in LISTED)
export type ActivityType =
  | "task_created"
  | "task_completed"
  | "task_uncompleted"
  | "task_updated"
  | "task_deleted"
  | "task_moved"
  | "reminder_set"
  | "reminder_triggered";

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  taskId?: string;
  taskTitle?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// Priority colors matching Todoist
export const PRIORITY_COLORS: Record<Priority, string> = {
  1: "#d1453b", // Red - highest
  2: "#eb8909", // Orange
  3: "#246fe0", // Blue
  4: "#808080", // Gray - lowest
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "Приоритет 1",
  2: "Приоритет 2",
  3: "Приоритет 3",
  4: "Приоритет 4",
};
