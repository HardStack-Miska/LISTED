import { create } from 'zustand';
import { database, Block } from '@/database';
import { Q } from '@nozbe/watermelondb';
import type { BlockType, BlockData } from '@/types';
import { DEFAULT_BLOCK_TYPE } from '@/constants';

interface BlockState {
  blocks: Block[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBlocks: (pageId: string) => Promise<void>;
  createBlock: (
    pageId: string,
    type?: BlockType,
    data?: BlockData,
    order?: number
  ) => Promise<Block>;
  updateBlock: (id: string, updates: { type?: BlockType; data?: BlockData }) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  reorderBlocks: (pageId: string, blockIds: string[]) => Promise<void>;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blocks: [],
  isLoading: false,
  error: null,

  loadBlocks: async (pageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const blocksCollection = database.get<Block>('blocks');
      const blocks = await blocksCollection
        .query(
          Q.where('page_id', pageId),
          Q.sortBy('order', Q.asc)
        )
        .fetch();

      set({ blocks, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load blocks',
        isLoading: false
      });
    }
  },

  createBlock: async (
    pageId: string,
    type: BlockType = DEFAULT_BLOCK_TYPE,
    data: BlockData = {},
    order?: number
  ) => {
    const blocksCollection = database.get<Block>('blocks');
    const currentBlocks = get().blocks;
    const newOrder = order ?? currentBlocks.length;

    const newBlock = await database.write(async () => {
      return await blocksCollection.create((block) => {
        block.pageId = pageId;
        block.type = type;
        block.data = data;
        block.order = newOrder;
      });
    });

    set((state) => ({
      blocks: [...state.blocks, newBlock].sort((a, b) => a.order - b.order)
    }));

    return newBlock;
  },

  updateBlock: async (id: string, updates: { type?: BlockType; data?: BlockData }) => {
    await database.write(async () => {
      const block = await database.get<Block>('blocks').find(id);
      await block.update((b) => {
        if (updates.type !== undefined) b.type = updates.type;
        if (updates.data !== undefined) b.data = updates.data;
      });
    });

    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, ...updates } as Block : b
      ),
    }));
  },

  deleteBlock: async (id: string) => {
    const blockToDelete = get().blocks.find((b) => b.id === id);
    if (!blockToDelete) return;

    await database.write(async () => {
      const block = await database.get<Block>('blocks').find(id);
      await block.destroyPermanently();

      // Reorder remaining blocks
      const remainingBlocks = get().blocks
        .filter((b) => b.id !== id)
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < remainingBlocks.length; i++) {
        const b = remainingBlocks[i];
        if (b && b.order !== i) {
          const blockToUpdate = await database.get<Block>('blocks').find(b.id);
          await blockToUpdate.update((block) => {
            block.order = i;
          });
        }
      }
    });

    set((state) => ({
      blocks: state.blocks
        .filter((b) => b.id !== id)
        .map((b, index) => ({ ...b, order: index } as Block)),
    }));
  },

  reorderBlocks: async (pageId: string, blockIds: string[]) => {
    await database.write(async () => {
      for (let i = 0; i < blockIds.length; i++) {
        const blockId = blockIds[i];
        if (blockId) {
          const block = await database.get<Block>('blocks').find(blockId);
          await block.update((b) => {
            b.order = i;
          });
        }
      }
    });

    set((state) => ({
      blocks: blockIds
        .map((id, index) => {
          const block = state.blocks.find((b) => b.id === id);
          return block ? { ...block, order: index } as Block : null;
        })
        .filter((b): b is Block => b !== null),
    }));
  },
}));
