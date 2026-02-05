import { useState, useCallback, useEffect } from 'react';
import { databaseService } from '@/services/database';
import { BLOCK_TYPES } from '@/constants';
import type { Page, Block, BlockType } from '@/types';
import type { EditorBlock, ExtendedBlockData } from '@/types/editor';

interface UsePageDataResult {
  page: Page | null;
  blocks: EditorBlock[];
  isLoading: boolean;
  error: string | null;
  updateTitle: (title: string) => Promise<void>;
  updateIcon: (icon: string) => Promise<void>;
  saveBlocks: (blocks: EditorBlock[]) => Promise<void>;
}

const blockToEditorBlock = (block: Block): EditorBlock => ({
  id: block.id,
  type: block.type as BlockType,
  data: block.data as ExtendedBlockData,
  order: block.order,
});

const editorBlockToBlock = (block: EditorBlock, pageId: string): Omit<Block, 'createdAt' | 'updatedAt'> => ({
  id: block.id,
  type: block.type,
  data: block.data,
  order: block.order,
  pageId,
});

export const usePageData = (pageId: string | undefined): UsePageDataResult => {
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    if (!pageId || pageId === 'new') {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      await databaseService.initDatabase();

      const loadedPage = await databaseService.getPage(pageId);
      if (!loadedPage) {
        setError('Страница не найдена');
        return;
      }

      setPage(loadedPage);

      const loadedBlocks = await databaseService.getBlocksByPageId(pageId);

      if (loadedBlocks.length === 0) {
        // Создаем пустой блок для новой страницы
        setBlocks([{
          id: `block_${Date.now()}`,
          type: BLOCK_TYPES.PARAGRAPH as BlockType,
          data: { text: '' },
          order: 0,
        }]);
      } else {
        setBlocks(loadedBlocks.map(blockToEditorBlock));
      }
    } catch (err) {
      setError('Не удалось загрузить страницу');
      console.error('Error loading page:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const updateTitle = useCallback(async (title: string) => {
    if (!pageId || pageId === 'new') return;

    try {
      await databaseService.updatePage(pageId, { title });
      setPage((prev) => prev ? { ...prev, title, updatedAt: new Date() } : null);
    } catch (err) {
      console.error('Error updating title:', err);
    }
  }, [pageId]);

  const updateIcon = useCallback(async (icon: string) => {
    if (!pageId || pageId === 'new') return;

    try {
      await databaseService.updatePage(pageId, { icon });
      setPage((prev) => prev ? { ...prev, icon, updatedAt: new Date() } : null);
    } catch (err) {
      console.error('Error updating icon:', err);
    }
  }, [pageId]);

  const saveBlocks = useCallback(async (newBlocks: EditorBlock[]) => {
    if (!pageId || pageId === 'new') return;

    try {
      const blocksToSave = newBlocks.map((b, index) => ({
        ...editorBlockToBlock(b, pageId),
        order: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as Block[];

      await databaseService.saveBlocks(pageId, blocksToSave);
    } catch (err) {
      console.error('Error saving blocks:', err);
    }
  }, [pageId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  return {
    page,
    blocks,
    isLoading,
    error,
    updateTitle,
    updateIcon,
    saveBlocks,
  };
};
