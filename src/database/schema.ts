import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'workspaces',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'pages',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'parent_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'blocks',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'data', type: 'string' }, // JSON string
        { name: 'order', type: 'number', isIndexed: true },
        { name: 'page_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
