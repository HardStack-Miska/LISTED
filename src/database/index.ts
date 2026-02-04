import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { Workspace, Page, Block } from './models';
import { DATABASE } from '@/constants';

const adapter = new SQLiteAdapter({
  schema,
  dbName: DATABASE.NAME,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Workspace, Page, Block],
});

export { Workspace, Page, Block };
export { schema };
