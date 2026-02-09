import { useState, useCallback, useEffect } from "react";
import { databaseService } from "@/services/database";
import type { Label } from "@/types";

interface UseLabelsResult {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createLabel: (name: string, color: string) => Promise<{ id: string }>;
  updateLabel: (
    id: string,
    updates: Partial<{ name: string; color: string; order: number }>,
  ) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  getLabel: (id: string) => Label | undefined;
  addLabelToTask: (taskId: string, labelId: string) => Promise<void>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
}

export const useLabels = (): UseLabelsResult => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLabels = useCallback(async () => {
    try {
      setError(null);
      const data = await databaseService.getLabels();
      setLabels(data);
    } catch (err) {
      setError("Не удалось загрузить метки");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadLabels();
  }, [loadLabels]);

  const createLabel = useCallback(
    async (name: string, color: string): Promise<{ id: string }> => {
      const result = await databaseService.createLabel(name, color);
      const newLabel: Label = {
        id: result.id,
        name,
        color,
        order: 0, // Will be properly set by DB
      };
      setLabels((prev) => {
        const maxOrder = prev.reduce((max, l) => Math.max(max, l.order), -1);
        return [...prev, { ...newLabel, order: maxOrder + 1 }];
      });
      return result;
    },
    [],
  );

  const updateLabel = useCallback(
    async (
      id: string,
      updates: Partial<{ name: string; color: string; order: number }>,
    ): Promise<void> => {
      await databaseService.updateLabel(id, updates);
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      );
    },
    [],
  );

  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    await databaseService.deleteLabel(id);
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getLabel = useCallback(
    (id: string): Label | undefined => {
      return labels.find((l) => l.id === id);
    },
    [labels],
  );

  const addLabelToTask = useCallback(
    async (taskId: string, labelId: string): Promise<void> => {
      await databaseService.addLabelToTask(taskId, labelId);
    },
    [],
  );

  const removeLabelFromTask = useCallback(
    async (taskId: string, labelId: string): Promise<void> => {
      await databaseService.removeLabelFromTask(taskId, labelId);
    },
    [],
  );

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  return {
    labels,
    isLoading,
    error,
    refresh,
    createLabel,
    updateLabel,
    deleteLabel,
    getLabel,
    addLabelToTask,
    removeLabelFromTask,
  };
};
