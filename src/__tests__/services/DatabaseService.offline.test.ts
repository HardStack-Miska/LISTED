/**
 * Offline-first SQLite tests.
 * Verifies that DatabaseService works correctly without network
 * using mocked expo-sqlite.
 */

// In-memory store to simulate SQLite
const mockStore: Record<string, unknown[]> = {
  tasks: [],
  labels: [],
  task_labels: [],
  projects: [],
  workspaces: [],
  settings: [],
};

const mockRunAsync = jest.fn(async (sql: string, ...params: unknown[]) => {
  const insertMatch = sql.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)/i);
  if (insertMatch && insertMatch[1]) {
    const table = insertMatch[1];
    if (!mockStore[table]) mockStore[table] = [];
    mockStore[table].push(params);
  }
  return { changes: 1, lastInsertRowId: 1 };
});

const mockGetFirstAsync = jest.fn(async (sql: string, ...params: unknown[]) => {
  if (sql.includes('PRAGMA user_version')) {
    return { user_version: 6 };
  }
  if (sql.includes('COUNT(*)')) {
    return { count: 1 };
  }
  if (sql.includes('MAX(')) {
    return { maxOrder: 0 };
  }
  if (sql.includes('FROM tasks WHERE id')) {
    return {
      id: params[0],
      title: 'Test Task',
      description: null,
      priority: 2,
      due_date: new Date().toISOString(),
      due_time: null,
      completed: 0,
      completed_at: null,
      project_id: null,
      parent_id: null,
      task_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  if (sql.includes('FROM settings WHERE key')) {
    return null;
  }
  return null;
});

const mockGetAllAsync = jest.fn(async (sql: string) => {
  if (sql.includes('FROM workspaces')) {
    return [
      {
        id: 'ws_1',
        name: 'Default',
        icon: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
  if (sql.includes('FROM tasks')) {
    return [];
  }
  if (sql.includes('FROM task_labels')) {
    return [];
  }
  if (sql.includes('FROM labels')) {
    return [];
  }
  if (sql.includes('FROM projects')) {
    return [];
  }
  return [];
});

const mockExecAsync = jest.fn(async () => {});
const mockWithTransactionAsync = jest.fn(async (cb: () => Promise<void>) => cb());

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: mockExecAsync,
      runAsync: mockRunAsync,
      getFirstAsync: mockGetFirstAsync,
      getAllAsync: mockGetAllAsync,
      withTransactionAsync: mockWithTransactionAsync,
    }),
  ),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

// Must require AFTER mocks
const { databaseService } = require('@/services/database/DatabaseService');

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store
  Object.keys(mockStore).forEach((key) => {
    mockStore[key] = [];
  });
});

describe('DatabaseService (offline)', () => {
  describe('initDatabase', () => {
    it('should initialize without network', async () => {
      // Reset the singleton's initialized state
      (databaseService as any).initialized = false;
      (databaseService as any).db = null;

      await databaseService.initDatabase();

      expect(require('expo-sqlite').openDatabaseAsync).toHaveBeenCalledWith(
        'listed.db',
      );
    });
  });

  describe('createTask', () => {
    it('should create a task locally without network', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      const result = await databaseService.createTask({
        title: 'Buy groceries',
        priority: 2,
        dueDate: new Date('2026-02-07'),
      });

      expect(result).toHaveProperty('id');
      expect(result.id).toBeTruthy();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        expect.any(String),
        'Buy groceries',
        null,
        2,
        expect.any(String),
        null,
        null,
        null,
        null,
        expect.any(String),
        expect.any(String),
      );
    });

    it('should create a task with labels', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      await databaseService.createTask({
        title: 'Labeled task',
        labels: ['label_1', 'label_2'],
      });

      // INSERT task + 2 INSERT label associations
      expect(mockRunAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('getTask', () => {
    it('should retrieve a task by id', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      const task = await databaseService.getTask('test_id');

      expect(task).not.toBeNull();
      expect(task.id).toBe('test_id');
      expect(task.title).toBe('Test Task');
      expect(task.priority).toBe(2);
      expect(task.completed).toBe(false);
    });

    it('should return null for non-existent task', async () => {
      (databaseService as any).initialized = true;
      mockGetFirstAsync.mockResolvedValueOnce(null);
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      const task = await databaseService.getTask('nonexistent');
      expect(task).toBeNull();
    });
  });

  describe('toggleTaskComplete', () => {
    it('should toggle task completion status', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      await databaseService.toggleTaskComplete('test_id');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks SET completed'),
        1,
        expect.any(String),
        expect.any(String),
        'test_id',
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by id', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      await databaseService.deleteTask('test_id');

      expect(mockRunAsync).toHaveBeenCalledWith(
        'DELETE FROM tasks WHERE id = ?',
        'test_id',
      );
    });
  });

  describe('projects (offline)', () => {
    it('should create a project without network', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      const project = await databaseService.createProject({
        name: 'Work',
        color: '#dc4c3e',
      });

      expect(project).toHaveProperty('id');
      expect(project.name).toBe('Work');
      expect(project.color).toBe('#dc4c3e');
    });
  });

  describe('labels (offline)', () => {
    it('should create a label without network', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      const result = await databaseService.createLabel('urgent', '#ff0000');

      expect(result).toHaveProperty('id');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO labels'),
        expect.any(String),
        'urgent',
        '#ff0000',
      );
    });
  });

  describe('settings (offline)', () => {
    it('should store and retrieve settings locally', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      await databaseService.setSetting('theme', 'dark');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO settings'),
        'theme',
        'dark',
        expect.any(String),
      );
    });
  });

  describe('transactions (offline)', () => {
    it('should use transactions for batch operations', async () => {
      (databaseService as any).initialized = true;
      (databaseService as any).db = {
        execAsync: mockExecAsync,
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        withTransactionAsync: mockWithTransactionAsync,
      };

      await databaseService.saveBlocks('page_1', [
        {
          id: 'b1',
          type: 'paragraph',
          data: { text: 'hello' },
          order: 0,
          pageId: 'page_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      expect(mockWithTransactionAsync).toHaveBeenCalled();
    });
  });
});
