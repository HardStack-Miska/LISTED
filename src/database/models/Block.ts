import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  relation,
  json,
} from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type { BlockType, BlockData } from '@/types';

const sanitizeBlockData = (raw: unknown): BlockData => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as BlockData;
  }
  return {};
};

export class Block extends Model {
  static table = 'blocks';

  static associations: Associations = {
    page: { type: 'belongs_to', key: 'page_id' },
  };

  @text('type') type!: BlockType;
  @json('data', sanitizeBlockData) data!: BlockData;
  @field('order') order!: number;
  @text('page_id') pageId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('pages', 'page_id') page!: unknown;
}
