import { Platform } from "react-native";
import type {
  Task,
  Project,
  Label,
  SearchFilters,
  RecurrenceRule,
  Page,
  Block,
  Workspace,
  BlockType,
} from "@/types";

const STORAGE_KEYS = {
  TASKS: "listed_tasks",
  PROJECTS: "listed_projects",
  LABELS: "listed_labels",
  PAGES: "listed_pages",
  BLOCKS: "listed_blocks",
  WORKSPACES: "listed_workspaces",
  SETTINGS: "listed_settings",
};

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Simple localStorage-based database for web platform
 * Uses JSON storage instead of SQLite
 */
class WebDatabaseService {
  private static instance: WebDatabaseService;
  private initialized = false;

  private constructor() {}

  static getInstance(): WebDatabaseService {
    if (!WebDatabaseService.instance) {
      WebDatabaseService.instance = new WebDatabaseService();
    }
    return WebDatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.initialized || Platform.OS !== "web") return;
    this.initialized = true;
  }

  private getStorage<T>(key: string): T[] {
    if (Platform.OS !== "web") return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStorage<T>(key: string, data: T[]): void {
    if (Platform.OS !== "web") return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  // Tasks
  async getTasks(filters?: SearchFilters): Promise<Task[]> {
    let tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);

    // Filter out subtasks from main list
    tasks = tasks.filter((t) => !t.parentId);

    if (filters?.projectId) {
      tasks = tasks.filter((t) => t.projectId === filters.projectId);
    }
    if (filters?.completed !== undefined) {
      tasks = tasks.filter((t) => t.completed === filters.completed);
    }
    if (filters?.priority) {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    return tasks.sort((a, b) => a.order - b.order);
  }

  async getTask(id: string): Promise<Task | null> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks.find((t) => t.id === id) ?? null;
  }

  async getTasksForToday(): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter(
      (t) =>
        !t.parentId &&
        !t.completed &&
        t.dueDate &&
        new Date(t.dueDate).toISOString().split("T")[0] === today,
    );
  }

  async getTasksUpcoming(days: number = 7): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return tasks.filter((t) => {
      if (t.parentId || t.completed || !t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return taskDate >= today && taskDate <= endDate;
    });
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks.filter((t) => t.parentId === parentId);
  }

  async createTask(task: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: Date;
    dueTime?: string;
    projectId?: string;
    parentId?: string;
    labels?: string[];
    completed?: boolean;
    sourcePageId?: string;
    sourceBlockId?: string;
  }): Promise<{ id: string }> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const now = new Date();
    const id = generateId();
    const newTask: Task = {
      id,
      title: task.title,
      description: task.description,
      priority: (task.priority ?? 4) as 1 | 2 | 3 | 4,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      completed: task.completed ?? false,
      projectId: task.projectId,
      parentId: task.parentId,
      sourcePageId: task.sourcePageId,
      sourceBlockId: task.sourceBlockId,
      labels: task.labels ?? [],
      order: tasks.length,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(newTask);
    this.setStorage(STORAGE_KEYS.TASKS, tasks);
    return { id };
  }

  async createSubtask(
    parentId: string,
    task: { title: string; priority?: number; dueDate?: Date },
  ): Promise<{ id: string }> {
    return this.createTask({ ...task, parentId });
  }

  async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      priority: 1 | 2 | 3 | 4;
      dueDate: Date | null;
      dueTime: string | null;
      projectId: string | null;
      recurrence: RecurrenceRule | null;
    }>,
  ): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      const task = tasks[index];
      if (task) {
        // Convert null to undefined for optional fields
        const sanitizedUpdates: Partial<Task> = {};
        if (updates.title !== undefined) sanitizedUpdates.title = updates.title;
        if (updates.description !== undefined)
          sanitizedUpdates.description = updates.description;
        if (updates.priority !== undefined)
          sanitizedUpdates.priority = updates.priority;
        if (updates.dueDate !== undefined)
          sanitizedUpdates.dueDate = updates.dueDate ?? undefined;
        if (updates.dueTime !== undefined)
          sanitizedUpdates.dueTime = updates.dueTime ?? undefined;
        if (updates.projectId !== undefined)
          sanitizedUpdates.projectId = updates.projectId ?? undefined;
        if (updates.recurrence !== undefined)
          sanitizedUpdates.recurrence = updates.recurrence ?? undefined;

        tasks[index] = {
          ...task,
          ...sanitizedUpdates,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }

  async toggleTaskComplete(id: string): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      const task = tasks[index];
      if (task) {
        const newCompleted = !task.completed;
        tasks[index] = {
          ...task,
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : undefined,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }

  async deleteTask(id: string): Promise<void> {
    let tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    // Delete task and its subtasks
    tasks = tasks.filter((t) => t.id !== id && t.parentId !== id);
    this.setStorage(STORAGE_KEYS.TASKS, tasks);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.getStorage<Project>(STORAGE_KEYS.PROJECTS);
  }

  async createProject(project: {
    name: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }): Promise<Project> {
    const projects = this.getStorage<Project>(STORAGE_KEYS.PROJECTS);
    const now = new Date();
    const newProject: Project = {
      id: generateId(),
      name: project.name,
      color: project.color ?? "#6366F1",
      icon: project.icon,
      parentId: project.parentId,
      order: projects.length,
      createdAt: now,
      updatedAt: now,
    };
    projects.push(newProject);
    this.setStorage(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  }

  async updateProject(
    id: string,
    updates: Partial<{
      name: string;
      color: string;
      icon: string | null;
      parentId: string | null;
      order: number;
    }>,
  ): Promise<void> {
    const projects = this.getStorage<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      const project = projects[index];
      if (project) {
        // Convert null to undefined for optional fields
        const sanitizedUpdates: Partial<Project> = {};
        if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
        if (updates.color !== undefined) sanitizedUpdates.color = updates.color;
        if (updates.icon !== undefined)
          sanitizedUpdates.icon = updates.icon ?? undefined;
        if (updates.parentId !== undefined)
          sanitizedUpdates.parentId = updates.parentId ?? undefined;
        if (updates.order !== undefined) sanitizedUpdates.order = updates.order;

        projects[index] = {
          ...project,
          ...sanitizedUpdates,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.PROJECTS, projects);
      }
    }
  }

  async deleteProject(id: string): Promise<void> {
    let projects = this.getStorage<Project>(STORAGE_KEYS.PROJECTS);
    projects = projects.filter((p) => p.id !== id);
    this.setStorage(STORAGE_KEYS.PROJECTS, projects);
  }

  // Labels
  async getLabels(): Promise<Label[]> {
    return this.getStorage<Label>(STORAGE_KEYS.LABELS);
  }

  async createLabel(name: string, color: string): Promise<{ id: string }> {
    const labels = this.getStorage<Label>(STORAGE_KEYS.LABELS);
    const id = generateId();
    const newLabel: Label = {
      id,
      name,
      color,
      order: labels.length,
    };
    labels.push(newLabel);
    this.setStorage(STORAGE_KEYS.LABELS, labels);
    return { id };
  }

  async updateLabel(
    id: string,
    updates: Partial<{ name: string; color: string }>,
  ): Promise<void> {
    const labels = this.getStorage<Label>(STORAGE_KEYS.LABELS);
    const index = labels.findIndex((l) => l.id === id);
    if (index !== -1) {
      const label = labels[index];
      if (label) {
        labels[index] = { ...label, ...updates };
        this.setStorage(STORAGE_KEYS.LABELS, labels);
      }
    }
  }

  async deleteLabel(id: string): Promise<void> {
    let labels = this.getStorage<Label>(STORAGE_KEYS.LABELS);
    labels = labels.filter((l) => l.id !== id);
    this.setStorage(STORAGE_KEYS.LABELS, labels);
  }

  // Task Labels
  async addLabelToTask(taskId: string, labelId: string): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasks[index];
      if (task && !task.labels.includes(labelId)) {
        tasks[index] = {
          ...task,
          labels: [...task.labels, labelId],
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }

  async removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasks[index];
      if (task) {
        tasks[index] = {
          ...task,
          labels: task.labels.filter((l) => l !== labelId),
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ==================== WORKSPACES ====================

  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = this.getStorage<Workspace>(STORAGE_KEYS.WORKSPACES);
    if (workspaces.length === 0) {
      // Create default workspace
      const defaultWorkspace = await this.createWorkspace({
        id: generateId(),
        name: "Мои заметки",
        icon: "📝",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return [defaultWorkspace];
    }
    return workspaces;
  }

  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    const workspaces = this.getStorage<Workspace>(STORAGE_KEYS.WORKSPACES);
    workspaces.push(workspace);
    this.setStorage(STORAGE_KEYS.WORKSPACES, workspaces);
    return workspace;
  }

  // ==================== PAGES ====================

  async getPages(workspaceId: string): Promise<Page[]> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    return pages
      .filter((p) => p.workspaceId === workspaceId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  async getPage(id: string): Promise<Page | null> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    return pages.find((p) => p.id === id) ?? null;
  }

  async createPage(
    page: Omit<Page, "id" | "createdAt" | "updatedAt">,
  ): Promise<Page> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    const now = new Date();
    const newPage: Page = {
      ...page,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    pages.push(newPage);
    this.setStorage(STORAGE_KEYS.PAGES, pages);
    return newPage;
  }

  async updatePage(id: string, updates: Partial<Page>): Promise<void> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    const index = pages.findIndex((p) => p.id === id);
    if (index !== -1) {
      const page = pages[index];
      if (page) {
        pages[index] = {
          ...page,
          ...updates,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.PAGES, pages);
      }
    }
  }

  async deletePage(id: string): Promise<void> {
    let pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    pages = pages.filter((p) => p.id !== id);
    this.setStorage(STORAGE_KEYS.PAGES, pages);
    // Also delete blocks for this page
    await this.deleteBlocksByPageId(id);
  }

  async searchPages(workspaceId: string, query: string): Promise<Page[]> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    const lowerQuery = query.toLowerCase();
    return pages
      .filter(
        (p) =>
          p.workspaceId === workspaceId &&
          p.title.toLowerCase().includes(lowerQuery),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  async getChildPages(parentId: string): Promise<Page[]> {
    const pages = this.getStorage<Page>(STORAGE_KEYS.PAGES);
    return pages
      .filter((p) => p.parentId === parentId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  async getPageWithAncestors(pageId: string): Promise<Page[]> {
    const ancestors: Page[] = [];
    let currentId: string | undefined = pageId;

    while (currentId) {
      const page = await this.getPage(currentId);
      if (!page) break;
      ancestors.unshift(page);
      currentId = page.parentId;
    }

    return ancestors;
  }

  async updatePageParent(pageId: string, newParentId?: string): Promise<void> {
    await this.updatePage(pageId, { parentId: newParentId });
  }

  async validateParentChange(
    pageId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | undefined = newParentId;
    while (currentId) {
      if (currentId === pageId) return false;
      const page = await this.getPage(currentId);
      if (!page) break;
      currentId = page.parentId;
    }
    return true;
  }

  // ==================== BLOCKS ====================

  async getBlocksByPageId(pageId: string): Promise<Block[]> {
    const blocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    return blocks
      .filter((b) => b.pageId === pageId)
      .sort((a, b) => a.order - b.order);
  }

  async createBlock(
    block: Omit<Block, "id" | "createdAt" | "updatedAt">,
  ): Promise<Block> {
    const blocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    const now = new Date();
    const newBlock: Block = {
      ...block,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    blocks.push(newBlock);
    this.setStorage(STORAGE_KEYS.BLOCKS, blocks);
    return newBlock;
  }

  async updateBlock(id: string, updates: Partial<Block>): Promise<void> {
    const blocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    const index = blocks.findIndex((b) => b.id === id);
    if (index !== -1) {
      const block = blocks[index];
      if (block) {
        blocks[index] = {
          ...block,
          ...updates,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.BLOCKS, blocks);
      }
    }
  }

  async deleteBlock(id: string): Promise<void> {
    let blocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    blocks = blocks.filter((b) => b.id !== id);
    this.setStorage(STORAGE_KEYS.BLOCKS, blocks);
  }

  async deleteBlocksByPageId(pageId: string): Promise<void> {
    let blocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    blocks = blocks.filter((b) => b.pageId !== pageId);
    this.setStorage(STORAGE_KEYS.BLOCKS, blocks);
  }

  async saveBlocks(pageId: string, blocks: Block[]): Promise<void> {
    let allBlocks = this.getStorage<Block>(STORAGE_KEYS.BLOCKS);
    // Remove old blocks for this page
    allBlocks = allBlocks.filter((b) => b.pageId !== pageId);
    // Add new blocks
    const now = new Date();
    const newBlocks = blocks.map((block) => ({
      ...block,
      updatedAt: now,
      createdAt: block.createdAt ?? now,
    }));
    allBlocks.push(...newBlocks);
    this.setStorage(STORAGE_KEYS.BLOCKS, allBlocks);
  }

  // ==================== SETTINGS ====================

  async getSetting(key: string): Promise<string | null> {
    const settings = this.getStorage<{ key: string; value: string }>(
      STORAGE_KEYS.SETTINGS,
    );
    const setting = settings.find((s) => s.key === key);
    return setting?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const settings = this.getStorage<{ key: string; value: string }>(
      STORAGE_KEYS.SETTINGS,
    );
    const index = settings.findIndex((s) => s.key === key);
    if (index !== -1) {
      settings[index] = { key, value };
    } else {
      settings.push({ key, value });
    }
    this.setStorage(STORAGE_KEYS.SETTINGS, settings);
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = this.getStorage<{ key: string; value: string }>(
      STORAGE_KEYS.SETTINGS,
    );
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async deleteSetting(key: string): Promise<void> {
    let settings = this.getStorage<{ key: string; value: string }>(
      STORAGE_KEYS.SETTINGS,
    );
    settings = settings.filter((s) => s.key !== key);
    this.setStorage(STORAGE_KEYS.SETTINGS, settings);
  }

  // ==================== SEARCH ====================

  async searchTasks(filters: SearchFilters): Promise<Task[]> {
    let tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);

    if (filters.query) {
      const lowerQuery = filters.query.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.description?.toLowerCase().includes(lowerQuery),
      );
    }

    if (filters.projectId !== undefined) {
      tasks = tasks.filter((t) => t.projectId === filters.projectId);
    }

    if (filters.priority !== undefined) {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    if (filters.completed !== undefined) {
      tasks = tasks.filter((t) => t.completed === filters.completed);
    }

    if (filters.parentId === null) {
      tasks = tasks.filter((t) => !t.parentId);
    } else if (filters.parentId !== undefined) {
      tasks = tasks.filter((t) => t.parentId === filters.parentId);
    }

    if (filters.labelIds && filters.labelIds.length > 0) {
      tasks = tasks.filter((t) =>
        filters.labelIds!.some((labelId) => t.labels.includes(labelId)),
      );
    }

    // Sort
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.order - b.order;
    });

    if (filters.limit !== undefined) {
      const offset = filters.offset ?? 0;
      tasks = tasks.slice(offset, offset + filters.limit);
    }

    return tasks;
  }

  // ==================== TEMPLATES ====================

  async getTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      icon?: string;
      content: string;
      category: string;
      isSystem: boolean;
      order: number;
    }>
  > {
    // Return system templates for web
    return [
      {
        id: "system_daily_note",
        name: "Дневная заметка",
        description: "Шаблон для ежедневного планирования и заметок",
        icon: "📅",
        content: JSON.stringify({ blocks: [] }),
        category: "productivity",
        isSystem: true,
        order: 0,
      },
      {
        id: "system_meeting",
        name: "Заметки встречи",
        description: "Шаблон для ведения протокола встреч",
        icon: "👥",
        content: JSON.stringify({ blocks: [] }),
        category: "productivity",
        isSystem: true,
        order: 1,
      },
      {
        id: "system_project",
        name: "Проект",
        description: "Шаблон для планирования проектов",
        icon: "🎯",
        content: JSON.stringify({ blocks: [] }),
        category: "productivity",
        isSystem: true,
        order: 2,
      },
    ];
  }

  async createTemplate(template: {
    name: string;
    description?: string;
    icon?: string;
    content: string;
    category?: string;
  }): Promise<{ id: string }> {
    return { id: generateId() };
  }

  async deleteTemplate(id: string): Promise<void> {
    // No-op for web
  }

  async initSystemTemplates(): Promise<void> {
    // No-op for web - templates are hardcoded
  }

  // ==================== INLINE TASKS ====================

  async createInlineTask(task: {
    title: string;
    priority?: number;
    dueDate?: Date;
    sourcePageId: string;
    sourceBlockId: string;
  }): Promise<{ id: string }> {
    const newTask = await this.createTask({
      title: task.title,
      priority: (task.priority ?? 4) as 1 | 2 | 3 | 4,
      dueDate: task.dueDate,
      completed: false,
      sourcePageId: task.sourcePageId,
      sourceBlockId: task.sourceBlockId,
    });
    return { id: newTask.id };
  }

  async getTasksByPageId(pageId: string): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks.filter((t) => t.sourcePageId === pageId);
  }

  async linkTaskToBlock(
    taskId: string,
    pageId: string,
    blockId: string,
  ): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasks[index];
      if (task) {
        tasks[index] = {
          ...task,
          sourcePageId: pageId,
          sourceBlockId: blockId,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.priority - b.priority;
      });
  }

  async getTasksByLabel(labelId: string): Promise<Task[]> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks
      .filter((t) => t.labels.includes(labelId))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.priority - b.priority;
      });
  }

  async updateTaskParent(taskId: string, newParentId?: string): Promise<void> {
    const tasks = this.getStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasks[index];
      if (task) {
        tasks[index] = {
          ...task,
          parentId: newParentId,
          updatedAt: new Date(),
        };
        this.setStorage(STORAGE_KEYS.TASKS, tasks);
      }
    }
  }
}

export const webDatabaseService = WebDatabaseService.getInstance();
