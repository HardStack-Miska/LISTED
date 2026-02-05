import { useState, useCallback, useEffect } from "react";
import { databaseService } from "@/services/database";
import type { Project } from "@/types";

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (data: {
    name: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }) => Promise<Project>;
  updateProject: (
    id: string,
    updates: Partial<{
      name: string;
      color: string;
      icon: string | null;
      parentId: string | null;
      order: number;
    }>,
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
}

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await databaseService.getProjects();
      setProjects(data);
    } catch (err) {
      setError("Не удалось загрузить проекты");
      console.error("Error loading projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(
    async (data: {
      name: string;
      color?: string;
      icon?: string;
      parentId?: string;
    }): Promise<Project> => {
      const newProject = await databaseService.createProject(data);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    },
    [],
  );

  const updateProject = useCallback(
    async (
      id: string,
      updates: Partial<{
        name: string;
        color: string;
        icon: string | null;
        parentId: string | null;
        order: number;
      }>,
    ): Promise<void> => {
      await databaseService.updateProject(id, updates);
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...updates,
            icon: updates.icon === null ? undefined : (updates.icon ?? p.icon),
            parentId:
              updates.parentId === null
                ? undefined
                : (updates.parentId ?? p.parentId),
            updatedAt: new Date(),
          };
        }),
      );
    },
    [],
  );

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await databaseService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProject = useCallback(
    (id: string): Project | undefined => {
      return projects.find((p) => p.id === id);
    },
    [projects],
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    getProject,
  };
};
