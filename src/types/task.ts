// Task types for Todoist-like functionality

export type Priority = 1 | 2 | 3 | 4;

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
  labels: string[];
  order: number;
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

export interface TaskGroup {
  title: string;
  tasks: Task[];
}

// Priority colors matching Todoist
export const PRIORITY_COLORS: Record<Priority, string> = {
  1: '#d1453b', // Red - highest
  2: '#eb8909', // Orange
  3: '#246fe0', // Blue
  4: '#808080', // Gray - lowest
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'Приоритет 1',
  2: 'Приоритет 2',
  3: 'Приоритет 3',
  4: 'Приоритет 4',
};
