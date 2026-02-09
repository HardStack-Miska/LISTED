// Analytics types for statistics screen

export interface OverviewStats {
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  totalCompleted: number;
  completionRate: number; // 0-100
  currentStreak: number; // consecutive days
  bestStreak: number;
}

export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  completed: number;
  label: string; // Display label (e.g., "Mon", "01")
}

export interface HeatmapData {
  byDayOfWeek: number[]; // index 0-6 (Sun-Sat), value = count
  byHour: number[]; // index 0-23, value = count
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface PriorityStats {
  priority: 1 | 2 | 3 | 4;
  total: number;
  completed: number;
  color: string;
  label: string;
}

export type AnalyticsPeriod = "week" | "month" | "year" | "all";

export interface AnalyticsData {
  overview: OverviewStats;
  trend: TrendDataPoint[];
  heatmap: HeatmapData;
  projects: ProjectStats[];
  priorities: PriorityStats[];
}
