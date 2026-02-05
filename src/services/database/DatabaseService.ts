import * as SQLite from "expo-sqlite";
import { DATABASE_NAME, DATABASE_VERSION, MIGRATIONS } from "./schema";
import type {
  Page,
  Block,
  Workspace,
  BlockType,
  Task,
  Project,
  Label,
  SearchFilters,
  RecurrenceRule,
} from "@/types";

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initDatabase(): Promise<void> {
    if (this.initialized) return;

    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.runMigrations();
    await this.ensureDefaultWorkspace();
    this.initialized = true;
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const currentVersion = result?.user_version ?? 0;

    for (
      let version = currentVersion + 1;
      version <= DATABASE_VERSION;
      version++
    ) {
      const migrations = MIGRATIONS[version];
      if (migrations) {
        for (const sql of migrations) {
          await this.db.execAsync(sql);
        }
      }
    }

    await this.db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  private async ensureDefaultWorkspace(): Promise<void> {
    const workspaces = await this.getWorkspaces();
    if (workspaces.length === 0) {
      await this.createWorkspace({
        id: generateId(),
        name: "Мои заметки",
        icon: "📝",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      icon: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM workspaces ORDER BY created_at");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    if (!this.db) await this.initDatabase();

    await this.db!.runAsync(
      `INSERT INTO workspaces (id, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      workspace.id,
      workspace.name,
      workspace.icon ?? null,
      workspace.createdAt.toISOString(),
      workspace.updatedAt.toISOString(),
    );

    return workspace;
  }

  // Pages
  async getPages(workspaceId: string): Promise<Page[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      icon: string | null;
      parent_id: string | null;
      workspace_id: string;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM pages WHERE workspace_id = ? ORDER BY updated_at DESC",
      workspaceId,
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      workspaceId: row.workspace_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getPage(id: string): Promise<Page | null> {
    if (!this.db) await this.initDatabase();

    const row = await this.db!.getFirstAsync<{
      id: string;
      title: string;
      icon: string | null;
      parent_id: string | null;
      workspace_id: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM pages WHERE id = ?", id);

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      workspaceId: row.workspace_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createPage(
    page: Omit<Page, "id" | "createdAt" | "updatedAt">,
  ): Promise<Page> {
    if (!this.db) await this.initDatabase();

    const now = new Date();
    const newPage: Page = {
      ...page,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    await this.db!.runAsync(
      `INSERT INTO pages (id, title, icon, parent_id, workspace_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newPage.id,
      newPage.title,
      newPage.icon ?? null,
      newPage.parentId ?? null,
      newPage.workspaceId,
      newPage.createdAt.toISOString(),
      newPage.updatedAt.toISOString(),
    );

    return newPage;
  }

  async updatePage(id: string, updates: Partial<Page>): Promise<void> {
    if (!this.db) await this.initDatabase();

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.icon !== undefined) {
      fields.push("icon = ?");
      values.push(updates.icon ?? null);
    }
    if (updates.parentId !== undefined) {
      fields.push("parent_id = ?");
      values.push(updates.parentId ?? null);
    }

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.db!.runAsync(
      `UPDATE pages SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
    );
  }

  async deletePage(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM pages WHERE id = ?", id);
  }

  // Blocks
  async getBlocksByPageId(pageId: string): Promise<Block[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      type: string;
      data: string;
      block_order: number;
      page_id: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM blocks WHERE page_id = ? ORDER BY block_order", pageId);

    return rows.map((row) => ({
      id: row.id,
      type: row.type as BlockType,
      data: JSON.parse(row.data),
      order: row.block_order,
      pageId: row.page_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async createBlock(
    block: Omit<Block, "id" | "createdAt" | "updatedAt">,
  ): Promise<Block> {
    if (!this.db) await this.initDatabase();

    const now = new Date();
    const newBlock: Block = {
      ...block,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    await this.db!.runAsync(
      `INSERT INTO blocks (id, type, data, block_order, page_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newBlock.id,
      newBlock.type,
      JSON.stringify(newBlock.data),
      newBlock.order,
      newBlock.pageId,
      newBlock.createdAt.toISOString(),
      newBlock.updatedAt.toISOString(),
    );

    return newBlock;
  }

  async updateBlock(id: string, updates: Partial<Block>): Promise<void> {
    if (!this.db) await this.initDatabase();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.type !== undefined) {
      fields.push("type = ?");
      values.push(updates.type);
    }
    if (updates.data !== undefined) {
      fields.push("data = ?");
      values.push(JSON.stringify(updates.data));
    }
    if (updates.order !== undefined) {
      fields.push("block_order = ?");
      values.push(updates.order);
    }

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.db!.runAsync(
      `UPDATE blocks SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
    );
  }

  async deleteBlock(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM blocks WHERE id = ?", id);
  }

  async deleteBlocksByPageId(pageId: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM blocks WHERE page_id = ?", pageId);
  }

  async saveBlocks(pageId: string, blocks: Block[]): Promise<void> {
    if (!this.db) await this.initDatabase();

    // Удаляем старые блоки и вставляем новые в транзакции
    await this.db!.withTransactionAsync(async () => {
      await this.db!.runAsync("DELETE FROM blocks WHERE page_id = ?", pageId);

      for (const block of blocks) {
        const now = new Date().toISOString();
        await this.db!.runAsync(
          `INSERT INTO blocks (id, type, data, block_order, page_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          block.id,
          block.type,
          JSON.stringify(block.data),
          block.order,
          pageId,
          block.createdAt?.toISOString() ?? now,
          now,
        );
      }
    });
  }

  async searchPages(workspaceId: string, query: string): Promise<Page[]> {
    if (!this.db) await this.initDatabase();

    const searchPattern = `%${query}%`;

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      icon: string | null;
      parent_id: string | null;
      workspace_id: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM pages
       WHERE workspace_id = ? AND title LIKE ?
       ORDER BY updated_at DESC`,
      workspaceId,
      searchPattern,
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      workspaceId: row.workspace_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  // US-009: Nested Pages Methods

  async getChildPages(parentId: string): Promise<Page[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      icon: string | null;
      parent_id: string | null;
      workspace_id: string;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM pages WHERE parent_id = ? ORDER BY updated_at DESC",
      parentId,
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      workspaceId: row.workspace_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getPageWithAncestors(pageId: string): Promise<Page[]> {
    if (!this.db) await this.initDatabase();

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
    if (!this.db) await this.initDatabase();

    await this.db!.runAsync(
      "UPDATE pages SET parent_id = ?, updated_at = ? WHERE id = ?",
      newParentId ?? null,
      new Date().toISOString(),
      pageId,
    );
  }

  async validateParentChange(
    pageId: string,
    newParentId: string,
  ): Promise<boolean> {
    if (!this.db) await this.initDatabase();

    // Check if newParentId is a descendant of pageId
    // If it is, moving pageId under newParentId would create a cycle
    let currentId: string | undefined = newParentId;

    while (currentId) {
      if (currentId === pageId) {
        return false; // Would create a cycle
      }
      const page = await this.getPage(currentId);
      if (!page) break;
      currentId = page.parentId;
    }

    return true;
  }

  // ==================== TASKS ====================

  async createTask(task: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: Date;
    dueTime?: string;
    projectId?: string;
    parentId?: string;
    labels?: string[];
  }): Promise<{ id: string }> {
    if (!this.db) await this.initDatabase();

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.db!.runAsync(
      `INSERT INTO tasks (id, title, description, priority, due_date, due_time, project_id, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      task.title,
      task.description ?? null,
      task.priority ?? 4,
      task.dueDate?.toISOString() ?? null,
      task.dueTime ?? null,
      task.projectId ?? null,
      task.parentId ?? null,
      now,
      now,
    );

    // Add labels if provided
    if (task.labels && task.labels.length > 0) {
      for (const labelId of task.labels) {
        await this.db!.runAsync(
          "INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)",
          id,
          labelId,
        );
      }
    }

    return { id };
  }

  async getTask(id: string): Promise<Task | null> {
    if (!this.db) await this.initDatabase();

    const row = await this.db!.getFirstAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM tasks WHERE id = ?", id);

    if (!row) return null;

    const labels = await this.getTaskLabels(id);

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      priority: row.priority as 1 | 2 | 3 | 4,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      dueTime: row.due_time ?? undefined,
      completed: row.completed === 1,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      projectId: row.project_id ?? undefined,
      parentId: row.parent_id ?? undefined,
      labels,
      order: row.task_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async getTaskLabels(taskId: string): Promise<string[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{ label_id: string }>(
      "SELECT label_id FROM task_labels WHERE task_id = ?",
      taskId,
    );

    return rows.map((r) => r.label_id);
  }

  async getTasksForToday(): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks
       WHERE (due_date >= ? AND due_date < ?) OR (due_date < ? AND completed = 0)
       ORDER BY completed ASC, priority ASC, due_date ASC, task_order ASC`,
      today.toISOString(),
      tomorrow.toISOString(),
      today.toISOString(),
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  async getTasksUpcoming(): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks
       WHERE due_date >= ? AND completed = 0
       ORDER BY due_date ASC, priority ASC, task_order ASC`,
      today.toISOString(),
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  async toggleTaskComplete(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    const task = await this.getTask(id);
    if (!task) return;

    const now = new Date().toISOString();
    const newCompleted = task.completed ? 0 : 1;
    const completedAt = newCompleted === 1 ? now : null;

    await this.db!.runAsync(
      "UPDATE tasks SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?",
      newCompleted,
      completedAt,
      now,
      id,
    );
  }

  async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      priority: number;
      dueDate: Date | null;
      dueTime: string | null;
      projectId: string | null;
      recurrence: RecurrenceRule | null;
    }>,
  ): Promise<void> {
    if (!this.db) await this.initDatabase();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.priority !== undefined) {
      fields.push("priority = ?");
      values.push(updates.priority);
    }
    if (updates.dueDate !== undefined) {
      fields.push("due_date = ?");
      values.push(updates.dueDate?.toISOString() ?? null);
    }
    if (updates.dueTime !== undefined) {
      fields.push("due_time = ?");
      values.push(updates.dueTime);
    }
    if (updates.projectId !== undefined) {
      fields.push("project_id = ?");
      values.push(updates.projectId);
    }
    if (updates.recurrence !== undefined) {
      fields.push("recurrence = ?");
      values.push(
        updates.recurrence ? JSON.stringify(updates.recurrence) : null,
      );
    }

    if (fields.length === 0) return;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.db!.runAsync(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
    );
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM tasks WHERE id = ?", id);
  }

  // ==================== LABELS ====================

  async createLabel(name: string, color: string): Promise<{ id: string }> {
    if (!this.db) await this.initDatabase();

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.db!.runAsync(
      "INSERT INTO labels (id, name, color) VALUES (?, ?, ?)",
      id,
      name,
      color,
    );

    return { id };
  }

  async getLabels(): Promise<Label[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      color: string;
      label_order: number;
    }>("SELECT * FROM labels ORDER BY label_order ASC");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      order: row.label_order,
    }));
  }

  async getLabel(id: string): Promise<Label | null> {
    if (!this.db) await this.initDatabase();

    const row = await this.db!.getFirstAsync<{
      id: string;
      name: string;
      color: string;
      label_order: number;
    }>("SELECT * FROM labels WHERE id = ?", id);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      order: row.label_order,
    };
  }

  async updateLabel(
    id: string,
    updates: Partial<{ name: string; color: string; order: number }>,
  ): Promise<void> {
    if (!this.db) await this.initDatabase();

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }
    if (updates.order !== undefined) {
      fields.push("label_order = ?");
      values.push(updates.order);
    }

    if (fields.length === 0) return;

    values.push(id);

    await this.db!.runAsync(
      `UPDATE labels SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
    );
  }

  async deleteLabel(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM labels WHERE id = ?", id);
  }

  async addLabelToTask(taskId: string, labelId: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync(
      "INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)",
      taskId,
      labelId,
    );
  }

  async removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync(
      "DELETE FROM task_labels WHERE task_id = ? AND label_id = ?",
      taskId,
      labelId,
    );
  }

  async getTasksByLabel(labelId: string): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT t.* FROM tasks t
       INNER JOIN task_labels tl ON t.id = tl.task_id
       WHERE tl.label_id = ?
       ORDER BY t.completed ASC, t.priority ASC, t.due_date ASC`,
      labelId,
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  // ==================== INLINE TASKS ====================

  async createInlineTask(task: {
    title: string;
    priority?: number;
    dueDate?: Date;
    sourcePageId: string;
    sourceBlockId: string;
  }): Promise<{ id: string }> {
    if (!this.db) await this.initDatabase();

    const id = generateId();
    const now = new Date().toISOString();

    await this.db!.runAsync(
      `INSERT INTO tasks (id, title, priority, due_date, source_page_id, source_block_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      task.title,
      task.priority ?? 4,
      task.dueDate?.toISOString() ?? null,
      task.sourcePageId,
      task.sourceBlockId,
      now,
      now,
    );

    return { id };
  }

  async getTasksByPageId(pageId: string): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      source_page_id: string | null;
      source_block_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks WHERE source_page_id = ? ORDER BY task_order ASC`,
      pageId,
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          sourcePageId: row.source_page_id ?? undefined,
          sourceBlockId: row.source_block_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  async linkTaskToBlock(
    taskId: string,
    pageId: string,
    blockId: string,
  ): Promise<void> {
    if (!this.db) await this.initDatabase();

    await this.db!.runAsync(
      `UPDATE tasks SET source_page_id = ?, source_block_id = ?, updated_at = ? WHERE id = ?`,
      pageId,
      blockId,
      new Date().toISOString(),
      taskId,
    );
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
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      content: string;
      category: string;
      is_system: number;
      template_order: number;
    }>("SELECT * FROM templates ORDER BY is_system DESC, template_order ASC");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      icon: row.icon ?? undefined,
      content: row.content,
      category: row.category,
      isSystem: row.is_system === 1,
      order: row.template_order,
    }));
  }

  async createTemplate(template: {
    name: string;
    description?: string;
    icon?: string;
    content: string;
    category?: string;
  }): Promise<{ id: string }> {
    if (!this.db) await this.initDatabase();

    const id = generateId();
    const now = new Date().toISOString();

    await this.db!.runAsync(
      `INSERT INTO templates (id, name, description, icon, content, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      template.name,
      template.description ?? null,
      template.icon ?? null,
      template.content,
      template.category ?? "custom",
      now,
      now,
    );

    return { id };
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync(
      "DELETE FROM templates WHERE id = ? AND is_system = 0",
      id,
    );
  }

  async initSystemTemplates(): Promise<void> {
    if (!this.db) await this.initDatabase();

    // Check if system templates already exist
    const existing = await this.db!.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM templates WHERE is_system = 1",
    );

    if (existing && existing.count > 0) return;

    const now = new Date().toISOString();

    // Daily Note Template
    const dailyNoteContent = JSON.stringify({
      blocks: [
        { type: "heading1", data: { text: "{{date}}" } },
        { type: "heading2", data: { text: "Задачи на сегодня" } },
        { type: "task", data: { text: "", priority: 2 } },
        { type: "task", data: { text: "", priority: 3 } },
        { type: "task", data: { text: "", priority: 4 } },
        { type: "heading2", data: { text: "Заметки" } },
        { type: "paragraph", data: { text: "" } },
        { type: "heading2", data: { text: "Итоги дня" } },
        { type: "paragraph", data: { text: "" } },
      ],
    });

    await this.db!.runAsync(
      `INSERT INTO templates (id, name, description, icon, content, category, is_system, template_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "system_daily_note",
      "Дневная заметка",
      "Шаблон для ежедневного планирования и заметок",
      "📅",
      dailyNoteContent,
      "productivity",
      1,
      0,
      now,
      now,
    );

    // Meeting Notes Template
    const meetingContent = JSON.stringify({
      blocks: [
        { type: "heading1", data: { text: "Встреча: {{title}}" } },
        { type: "paragraph", data: { text: "Дата: {{date}}" } },
        { type: "paragraph", data: { text: "Участники: " } },
        { type: "heading2", data: { text: "Повестка" } },
        { type: "bulletList", data: { text: "" } },
        { type: "heading2", data: { text: "Обсуждение" } },
        { type: "paragraph", data: { text: "" } },
        { type: "heading2", data: { text: "Решения и действия" } },
        { type: "task", data: { text: "", priority: 2 } },
        { type: "task", data: { text: "", priority: 3 } },
      ],
    });

    await this.db!.runAsync(
      `INSERT INTO templates (id, name, description, icon, content, category, is_system, template_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "system_meeting",
      "Заметки встречи",
      "Шаблон для ведения протокола встреч",
      "👥",
      meetingContent,
      "productivity",
      1,
      1,
      now,
      now,
    );

    // Project Template
    const projectContent = JSON.stringify({
      blocks: [
        { type: "heading1", data: { text: "{{title}}" } },
        { type: "heading2", data: { text: "Описание" } },
        { type: "paragraph", data: { text: "" } },
        { type: "heading2", data: { text: "Цели" } },
        { type: "bulletList", data: { text: "" } },
        { type: "heading2", data: { text: "Задачи" } },
        { type: "task", data: { text: "", priority: 1 } },
        { type: "task", data: { text: "", priority: 2 } },
        { type: "task", data: { text: "", priority: 3 } },
        { type: "heading2", data: { text: "Ресурсы" } },
        { type: "paragraph", data: { text: "" } },
      ],
    });

    await this.db!.runAsync(
      `INSERT INTO templates (id, name, description, icon, content, category, is_system, template_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "system_project",
      "Проект",
      "Шаблон для планирования проектов",
      "🎯",
      projectContent,
      "productivity",
      1,
      2,
      now,
      now,
    );
  }

  // ==================== PROJECTS (Sprint 5) ====================

  async createProject(project: {
    name: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }): Promise<Project> {
    if (!this.db) await this.initDatabase();

    const id = generateId();
    const now = new Date();

    // Get next order
    const result = await this.db!.getFirstAsync<{ maxOrder: number | null }>(
      "SELECT MAX(project_order) as maxOrder FROM projects WHERE parent_id IS ?",
      project.parentId ?? null,
    );
    const order = (result?.maxOrder ?? -1) + 1;

    await this.db!.runAsync(
      `INSERT INTO projects (id, name, color, icon, parent_id, project_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      project.name,
      project.color ?? "#6366F1",
      project.icon ?? null,
      project.parentId ?? null,
      order,
      now.toISOString(),
      now.toISOString(),
    );

    return {
      id,
      name: project.name,
      color: project.color ?? "#6366F1",
      icon: project.icon,
      parentId: project.parentId,
      order,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
      parent_id: string | null;
      project_order: number;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM projects ORDER BY project_order ASC");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      order: row.project_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getProject(id: string): Promise<Project | null> {
    if (!this.db) await this.initDatabase();

    const row = await this.db!.getFirstAsync<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
      parent_id: string | null;
      project_order: number;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM projects WHERE id = ?", id);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon ?? undefined,
      parentId: row.parent_id ?? undefined,
      order: row.project_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
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
    if (!this.db) await this.initDatabase();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }
    if (updates.icon !== undefined) {
      fields.push("icon = ?");
      values.push(updates.icon);
    }
    if (updates.parentId !== undefined) {
      fields.push("parent_id = ?");
      values.push(updates.parentId);
    }
    if (updates.order !== undefined) {
      fields.push("project_order = ?");
      values.push(updates.order);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.db!.runAsync(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
    );
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    // Set project_id to null for all tasks in this project
    await this.db!.runAsync(
      "UPDATE tasks SET project_id = NULL WHERE project_id = ?",
      id,
    );

    // Delete the project
    await this.db!.runAsync("DELETE FROM projects WHERE id = ?", id);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks WHERE project_id = ?
       ORDER BY completed ASC, priority ASC, due_date ASC, task_order ASC`,
      projectId,
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  // ==================== SUBTASKS (Sprint 5) ====================

  async getSubtasks(parentId: string): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks WHERE parent_id = ?
       ORDER BY completed ASC, task_order ASC`,
      parentId,
    );

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  async createSubtask(
    parentId: string,
    task: { title: string; priority?: number; dueDate?: Date },
  ): Promise<{ id: string }> {
    if (!this.db) await this.initDatabase();

    // Get parent task to inherit project
    const parent = await this.getTask(parentId);

    const id = generateId();
    const now = new Date().toISOString();

    // Get next order within parent
    const result = await this.db!.getFirstAsync<{ maxOrder: number | null }>(
      "SELECT MAX(task_order) as maxOrder FROM tasks WHERE parent_id = ?",
      parentId,
    );
    const order = (result?.maxOrder ?? -1) + 1;

    await this.db!.runAsync(
      `INSERT INTO tasks (id, title, priority, due_date, parent_id, project_id, task_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      task.title,
      task.priority ?? 4,
      task.dueDate?.toISOString() ?? null,
      parentId,
      parent?.projectId ?? null,
      order,
      now,
      now,
    );

    return { id };
  }

  async updateTaskParent(taskId: string, newParentId?: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    await this.db!.runAsync(
      "UPDATE tasks SET parent_id = ?, updated_at = ? WHERE id = ?",
      newParentId ?? null,
      new Date().toISOString(),
      taskId,
    );
  }

  // ==================== SEARCH (Sprint 5) ====================

  async searchTasks(filters: SearchFilters): Promise<Task[]> {
    if (!this.db) await this.initDatabase();

    const conditions: string[] = [];
    const params: (string | number | null)[] = [];

    // Full-text search using FTS5
    if (filters.query && filters.query.trim()) {
      // Use FTS5 for text search
      conditions.push(
        `t.rowid IN (SELECT rowid FROM tasks_fts WHERE tasks_fts MATCH ?)`,
      );
      params.push(`${filters.query}*`);
    }

    // Project filter
    if (filters.projectId !== undefined) {
      conditions.push("t.project_id = ?");
      params.push(filters.projectId);
    }

    // Priority filter
    if (filters.priority !== undefined) {
      conditions.push("t.priority = ?");
      params.push(filters.priority);
    }

    // Completed filter
    if (filters.completed !== undefined) {
      conditions.push("t.completed = ?");
      params.push(filters.completed ? 1 : 0);
    }

    // Due date range
    if (filters.dueDateStart !== undefined) {
      conditions.push("t.due_date >= ?");
      params.push(filters.dueDateStart.toISOString());
    }
    if (filters.dueDateEnd !== undefined) {
      conditions.push("t.due_date <= ?");
      params.push(filters.dueDateEnd.toISOString());
    }

    // Has reminder
    if (filters.hasReminder !== undefined) {
      if (filters.hasReminder) {
        conditions.push(
          "EXISTS (SELECT 1 FROM reminders r WHERE r.task_id = t.id)",
        );
      } else {
        conditions.push(
          "NOT EXISTS (SELECT 1 FROM reminders r WHERE r.task_id = t.id)",
        );
      }
    }

    // Is recurring
    if (filters.isRecurring !== undefined) {
      if (filters.isRecurring) {
        conditions.push("t.recurrence IS NOT NULL");
      } else {
        conditions.push("t.recurrence IS NULL");
      }
    }

    // Parent filter (subtasks vs root tasks)
    if (filters.parentId === null) {
      conditions.push("t.parent_id IS NULL");
    } else if (filters.parentId !== undefined) {
      conditions.push("t.parent_id = ?");
      params.push(filters.parentId);
    }

    // Labels filter
    if (filters.labelIds && filters.labelIds.length > 0) {
      const placeholders = filters.labelIds.map(() => "?").join(", ");
      conditions.push(`EXISTS (
        SELECT 1 FROM task_labels tl
        WHERE tl.task_id = t.id AND tl.label_id IN (${placeholders})
      )`);
      params.push(...filters.labelIds);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let query = `
      SELECT t.* FROM tasks t
      ${whereClause}
      ORDER BY t.completed ASC, t.priority ASC, t.due_date ASC, t.task_order ASC
    `;

    // Pagination
    if (filters.limit !== undefined) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }
    if (filters.offset !== undefined) {
      query += ` OFFSET ?`;
      params.push(filters.offset);
    }

    const rows = await this.db!.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      priority: number;
      due_date: string | null;
      due_time: string | null;
      completed: number;
      completed_at: string | null;
      project_id: string | null;
      parent_id: string | null;
      task_order: number;
      created_at: string;
      updated_at: string;
    }>(query, ...params);

    return Promise.all(
      rows.map(async (row) => {
        const labels = await this.getTaskLabels(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          priority: row.priority as 1 | 2 | 3 | 4,
          dueDate: row.due_date ? new Date(row.due_date) : undefined,
          dueTime: row.due_time ?? undefined,
          completed: row.completed === 1,
          completedAt: row.completed_at
            ? new Date(row.completed_at)
            : undefined,
          projectId: row.project_id ?? undefined,
          parentId: row.parent_id ?? undefined,
          labels,
          order: row.task_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }),
    );
  }

  // ==================== SETTINGS (Sprint 5) ====================

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) await this.initDatabase();

    const row = await this.db!.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      key,
    );

    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    const now = new Date().toISOString();

    await this.db!.runAsync(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      key,
      value,
      now,
    );
  }

  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.db) await this.initDatabase();

    const rows = await this.db!.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings",
    );

    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return settings;
  }

  async deleteSetting(key: string): Promise<void> {
    if (!this.db) await this.initDatabase();
    await this.db!.runAsync("DELETE FROM settings WHERE key = ?", key);
  }
}

export const databaseService = DatabaseService.getInstance();
