export const DATABASE_NAME = 'listed.db';
export const DATABASE_VERSION = 1;

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
  'CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id)',
  'CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id)',
  'CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id)',
  'CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(page_id, block_order)',
];

export const MIGRATIONS: Record<number, string[]> = {
  1: [
    SCHEMA.workspaces,
    SCHEMA.pages,
    SCHEMA.blocks,
    ...INDEXES,
  ],
};
