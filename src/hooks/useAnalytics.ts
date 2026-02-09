import { useState, useEffect, useCallback } from "react";
import { analyticsService } from "@/services/analytics";
import type {
  OverviewStats,
  TrendDataPoint,
  HeatmapData,
  ProjectStats,
  PriorityStats,
  AnalyticsPeriod,
} from "@/types/analytics";

interface UseAnalyticsResult {
  overview: OverviewStats | null;
  trend: TrendDataPoint[];
  heatmap: HeatmapData | null;
  projects: ProjectStats[];
  priorities: PriorityStats[];
  period: AnalyticsPeriod;
  isLoading: boolean;
  error: string | null;
  setPeriod: (period: AnalyticsPeriod) => void;
  refresh: () => Promise<void>;
}

export const useAnalytics = (): UseAnalyticsResult => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [priorities, setPriorities] = useState<PriorityStats[]>([]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        overviewData,
        trendData,
        heatmapData,
        projectsData,
        prioritiesData,
      ] = await Promise.all([
        analyticsService.getOverviewStats(),
        analyticsService.getProductivityTrend(period),
        analyticsService.getHeatmapData(),
        analyticsService.getProjectStats(),
        analyticsService.getPriorityStats(),
      ]);

      setOverview(overviewData);
      setTrend(trendData);
      setHeatmap(heatmapData);
      setProjects(projectsData);
      setPriorities(prioritiesData);
    } catch (err) {
      setError("Не удалось загрузить статистику");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    overview,
    trend,
    heatmap,
    projects,
    priorities,
    period,
    isLoading,
    error,
    setPeriod,
    refresh: loadAnalytics,
  };
};
