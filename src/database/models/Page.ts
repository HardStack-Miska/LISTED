import { Model } from '@nozbe/watermelondb';
import {
  text,
  date,
  readonly,
  relation,
  children,
} from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Page extends Model {
  static table = 'pages';

  static associations: Associations = {
    workspace: { type: 'belongs_to', key: 'workspace_id' },
    parent: { type: 'belongs_to', key: 'parent_id' },
    blocks: { type: 'has_many', foreignKey: 'page_id' },
    children: { type: 'has_many', foreignKey: 'parent_id' },
  };

  @text('title') title!: string;
  @text('icon') icon?: string;
  @text('parent_id') parentId?: string;
  @text('workspace_id') workspaceId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('workspaces', 'workspace_id') workspace!: unknown;
  @relation('pages', 'parent_id') parent!: unknown;
  @children('blocks') blocks!: unknown;
  @children('pages') childPages!: unknown;
}
