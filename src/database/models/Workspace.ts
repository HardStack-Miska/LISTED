import { Model } from '@nozbe/watermelondb';
import { text, date, readonly, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class Workspace extends Model {
  static table = 'workspaces';

  static associations: Associations = {
    pages: { type: 'has_many', foreignKey: 'workspace_id' },
  };

  @text('name') name!: string;
  @text('icon') icon?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('pages') pages!: unknown;
}
