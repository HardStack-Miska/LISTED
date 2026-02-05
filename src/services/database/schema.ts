export const DATABASE_NAME = "listed.db";
export const DATABASE_VERSION = 2;

export const SCHEMA = {
  workspaces: `
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  pages: `
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      icon TEXT,
      parent_id TEXT,
      workspace_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `,
  blocks: `
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      block_order INTEGER NOT NULL,
      page_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    )
  `,
};

export const INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id)",
  "CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id)",
  "CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id)",
  "CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(page_id, block_order)",
];

// Sprint 3: Tasks schema
export const SCHEMA_V2 = {
  tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER NOT NULL DEFAULT 4,
      due_date TEXT,
      due_time TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      project_id TEXT,
      parent_id TEXT,
      task_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES pages(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `,
  labels: `
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      label_order INTEGER NOT NULL DEFAULT 0
    )
  `,
  task_labels: `
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `,
};

export const INDEXES_V2 = [
  "CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, task_order)",
  "CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels(task_id)",
  "CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id)",
];

export const MIGRATIONS: Record<number, string[]> = {
  1: [SCHEMA.workspaces, SCHEMA.pages, SCHEMA.blocks, ...INDEXES],
  2: [SCHEMA_V2.tasks, SCHEMA_V2.labels, SCHEMA_V2.task_labels, ...INDEXES_V2],
};
