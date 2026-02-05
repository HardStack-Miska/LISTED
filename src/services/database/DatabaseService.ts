import * as SQLite from "expo-sqlite";
import { DATABASE_NAME, DATABASE_VERSION, MIGRATIONS } from "./schema";
import type { Page, Block, Workspace, BlockType } from "@/types";

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
}

export const databaseService = DatabaseService.getInstance();
