import * as SQLite from "expo-sqlite";
import { DATABASE_NAME } from "../database/schema";
import type {
  OverviewStats,
  TrendDataPoint,
  HeatmapData,
  ProjectStats,
  PriorityStats,
  AnalyticsPeriod,
} from "@/types/analytics";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/types/task";

class AnalyticsService {
  private static instance: AnalyticsService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    }
    return this.db;
  }

  async getOverviewStats(): Promise<OverviewStats> {
    const db = await this.getDb();

    // Get counts for different periods
    const today = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks
       WHERE completed = 1 AND date(completed_at) = date('now', 'localtime')`,
    );

    const thisWeek = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks
       WHERE completed = 1 AND date(completed_at) >= date('now', 'localtime', 'weekday 0', '-7 days')`,
    );

    const thisMonth = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks
       WHERE completed = 1 AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now', 'localtime')`,
    );

    const total = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks WHERE completed = 1`,
    );

    // Completion rate (tasks completed on or before due date)
    const rateResult = await db.getFirstAsync<{ rate: number | null }>(
      `SELECT
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE CAST(SUM(CASE WHEN date(completed_at) <= date(due_date) THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*)
        END as rate
       FROM tasks
       WHERE completed = 1 AND due_date IS NOT NULL`,
    );

    // Calculate streaks
    const streaks = await this.calculateStreaks();

    return {
      completedToday: today?.count ?? 0,
      completedThisWeek: thisWeek?.count ?? 0,
      completedThisMonth: thisMonth?.count ?? 0,
      totalCompleted: total?.count ?? 0,
      completionRate: Math.round(rateResult?.rate ?? 0),
      currentStreak: streaks.current,
      bestStreak: streaks.best,
    };
  }

  private async calculateStreaks(): Promise<{ current: number; best: number }> {
    const db = await this.getDb();

    // Get all dates with completed tasks
    const dates = await db.getAllAsync<{ day: string }>(
      `SELECT DISTINCT date(completed_at, 'localtime') as day
       FROM tasks
       WHERE completed = 1 AND completed_at IS NOT NULL
       ORDER BY day DESC`,
    );

    if (dates.length === 0) {
      return { current: 0, best: 0 };
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if streak is current (today or yesterday has completed tasks)
    const firstDate = dates[0];
    const lastCompletedDate = firstDate ? new Date(firstDate.day) : new Date(0);
    const isCurrentStreak =
      lastCompletedDate.getTime() === today.getTime() ||
      lastCompletedDate.getTime() === yesterday.getTime();

    for (let i = 1; i < dates.length; i++) {
      const currentItem = dates[i - 1];
      const prevItem = dates[i];
      if (!currentItem || !prevItem) continue;
      const current = new Date(currentItem.day);
      const prev = new Date(prevItem.day);
      const diffDays = Math.round(
        (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (i === 1 || tempStreak > bestStreak) {
          bestStreak = Math.max(bestStreak, tempStreak);
        }
        tempStreak = 1;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);
    currentStreak = isCurrentStreak ? tempStreak : 0;

    return { current: currentStreak, best: bestStreak };
  }

  async getProductivityTrend(
    period: AnalyticsPeriod,
  ): Promise<TrendDataPoint[]> {
    const db = await this.getDb();

    let dateFilter: string;
    let groupBy: string;
    let labelFormat: string;

    switch (period) {
      case "week":
        dateFilter =
          "date(completed_at) >= date('now', 'localtime', '-7 days')";
        groupBy = "date(completed_at, 'localtime')";
        labelFormat = "%w"; // Day of week
        break;
      case "month":
        dateFilter =
          "date(completed_at) >= date('now', 'localtime', '-30 days')";
        groupBy = "date(completed_at, 'localtime')";
        labelFormat = "%d"; // Day of month
        break;
      case "year":
        dateFilter =
          "date(completed_at) >= date('now', 'localtime', '-365 days')";
        groupBy = "strftime('%Y-%m', completed_at, 'localtime')";
        labelFormat = "%m"; // Month
        break;
      default:
        dateFilter = "1=1";
        groupBy = "strftime('%Y-%m', completed_at, 'localtime')";
        labelFormat = "%Y-%m";
    }

    const rows = await db.getAllAsync<{
      day: string;
      completed: number;
    }>(
      `SELECT ${groupBy} as day, COUNT(*) as completed
       FROM tasks
       WHERE completed = 1 AND completed_at IS NOT NULL AND ${dateFilter}
       GROUP BY ${groupBy}
       ORDER BY day ASC`,
    );

    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const monthNames = [
      "Янв",
      "Фев",
      "Мар",
      "Апр",
      "Май",
      "Июн",
      "Июл",
      "Авг",
      "Сен",
      "Окт",
      "Ноя",
      "Дек",
    ];

    return rows.map((row) => {
      let label = row.day ?? "";
      if (period === "week" && row.day) {
        const date = new Date(row.day);
        label = dayNames[date.getDay()] ?? row.day;
      } else if (period === "year" && row.day) {
        const parts = row.day.split("-");
        const monthPart = parts[1];
        const monthIndex = monthPart ? parseInt(monthPart) - 1 : 0;
        label = monthNames[monthIndex] ?? row.day;
      } else if (period === "month" && row.day) {
        const parts = row.day.split("-");
        label = parts[2] ?? row.day;
      }

      return {
        date: row.day ?? "",
        completed: row.completed,
        label,
      };
    });
  }

  async getHeatmapData(): Promise<HeatmapData> {
    const db = await this.getDb();

    // Tasks by day of week
    const byDayRows = await db.getAllAsync<{ dow: number; count: number }>(
      `SELECT CAST(strftime('%w', completed_at, 'localtime') AS INTEGER) as dow, COUNT(*) as count
       FROM tasks
       WHERE completed = 1 AND completed_at IS NOT NULL
       GROUP BY dow`,
    );

    // Tasks by hour
    const byHourRows = await db.getAllAsync<{ hour: number; count: number }>(
      `SELECT CAST(strftime('%H', completed_at, 'localtime') AS INTEGER) as hour, COUNT(*) as count
       FROM tasks
       WHERE completed = 1 AND completed_at IS NOT NULL
       GROUP BY hour`,
    );

    const byDayOfWeek = new Array(7).fill(0);
    const byHour = new Array(24).fill(0);

    byDayRows.forEach((row) => {
      byDayOfWeek[row.dow] = row.count;
    });

    byHourRows.forEach((row) => {
      byHour[row.hour] = row.count;
    });

    return { byDayOfWeek, byHour };
  }

  async getProjectStats(): Promise<ProjectStats[]> {
    const db = await this.getDb();

    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      color: string;
      total: number;
      completed: number;
    }>(
      `SELECT p.id, p.name, p.color,
              COUNT(t.id) as total,
              SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id
       HAVING total > 0
       ORDER BY total DESC
       LIMIT 10`,
    );

    return rows.map((row) => ({
      projectId: row.id,
      projectName: row.name,
      projectColor: row.color,
      totalTasks: row.total,
      completedTasks: row.completed,
      completionRate:
        row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
    }));
  }

  async getPriorityStats(): Promise<PriorityStats[]> {
    const db = await this.getDb();

    const rows = await db.getAllAsync<{
      priority: number;
      total: number;
      completed: number;
    }>(
      `SELECT priority,
              COUNT(*) as total,
              SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
       FROM tasks
       GROUP BY priority
       ORDER BY priority ASC`,
    );

    const priorities: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

    return priorities.map((p) => {
      const row = rows.find((r) => r.priority === p);
      return {
        priority: p,
        total: row?.total ?? 0,
        completed: row?.completed ?? 0,
        color: PRIORITY_COLORS[p],
        label: PRIORITY_LABELS[p],
      };
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();
