export const DATABASE_NAME = "listed.db";
export const DATABASE_VERSION = 5;

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

// Sprint 4: Templates and task-page linking
export const SCHEMA_V3 = {
  templates: `
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      is_system INTEGER DEFAULT 0,
      template_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
};

export const MIGRATIONS_V3 = [
  // Add source_page_id and source_block_id to tasks for inline tasks
  "ALTER TABLE tasks ADD COLUMN source_page_id TEXT REFERENCES pages(id) ON DELETE SET NULL",
  "ALTER TABLE tasks ADD COLUMN source_block_id TEXT",
  // Templates table
  SCHEMA_V3.templates,
  // Index for finding tasks by source page
  "CREATE INDEX IF NOT EXISTS idx_tasks_source_page ON tasks(source_page_id)",
];

// Sprint 4.2: Premium features (free in LISTED)
export const SCHEMA_V4 = {
  reminders: `
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      reminder_type TEXT NOT NULL DEFAULT 'absolute',
      relative_minutes INTEGER,
      notification_id TEXT,
      triggered INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `,
  filters: `
    CREATE TABLE IF NOT EXISTS filters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      query TEXT NOT NULL,
      filter_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  activity_log: `
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT NOT NULL
    )
  `,
};

export const MIGRATIONS_V4 = [
  // Add duration and recurrence to tasks
  "ALTER TABLE tasks ADD COLUMN duration INTEGER",
  "ALTER TABLE tasks ADD COLUMN recurrence TEXT",
  // Reminders table
  SCHEMA_V4.reminders,
  // Custom filters table
  SCHEMA_V4.filters,
  // Activity log for history
  SCHEMA_V4.activity_log,
  // Indexes
  "CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id)",
  "CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time)",
  "CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id)",
  "CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC)",
];

// Sprint 5: Projects, Settings, Search
export const SCHEMA_V5 = {
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366F1',
      icon TEXT,
      parent_id TEXT,
      project_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `,
  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
};

export const MIGRATIONS_V5 = [
  // Projects table
  SCHEMA_V5.projects,
  // Settings table
  SCHEMA_V5.settings,
  // Indexes for projects
  "CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id)",
  "CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(project_order)",
  // FTS5 for full-text search on tasks
  "CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(title, description, content='tasks', content_rowid='rowid')",
  // Triggers to keep FTS in sync
  `CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
    INSERT INTO tasks_fts(rowid, title, description) VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
  END`,
  `CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
  END`,
  `CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
    INSERT INTO tasks_fts(rowid, title, description) VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
  END`,
];

export const MIGRATIONS: Record<number, string[]> = {
  1: [SCHEMA.workspaces, SCHEMA.pages, SCHEMA.blocks, ...INDEXES],
  2: [SCHEMA_V2.tasks, SCHEMA_V2.labels, SCHEMA_V2.task_labels, ...INDEXES_V2],
  3: MIGRATIONS_V3,
  4: MIGRATIONS_V4,
  5: MIGRATIONS_V5,
};
