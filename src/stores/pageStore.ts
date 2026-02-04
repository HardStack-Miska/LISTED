import { create } from 'zustand';
import { database, Page, Block } from '@/database';
import { Q } from '@nozbe/watermelondb';

interface PageState {
  currentPage: Page | null;
  pages: Page[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPages: (workspaceId: string) => Promise<void>;
  createPage: (
    workspaceId: string,
    title: string,
    parentId?: string,
    icon?: string
  ) => Promise<Page>;
  setCurrentPage: (page: Page | null) => void;
  updatePage: (id: string, updates: { title?: string; icon?: string }) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  getChildPages: (parentId: string) => Promise<Page[]>;
}

export const usePageStore = create<PageState>((set, get) => ({
  currentPage: null,
  pages: [],
  isLoading: false,
  error: null,

  loadPages: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const pagesCollection = database.get<Page>('pages');
      const pages = await pagesCollection
        .query(Q.where('workspace_id', workspaceId))
        .fetch();

      set({ pages, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load pages',
        isLoading: false
      });
    }
  },

  createPage: async (
    workspaceId: string,
    title: string,
    parentId?: string,
    icon?: string
  ) => {
    const pagesCollection = database.get<Page>('pages');

    const newPage = await database.write(async () => {
      return await pagesCollection.create((page) => {
        page.title = title;
        page.workspaceId = workspaceId;
        if (parentId) page.parentId = parentId;
        if (icon) page.icon = icon;
      });
    });

    set((state) => ({ pages: [...state.pages, newPage] }));
    return newPage;
  },

  setCurrentPage: (page: Page | null) => {
    set({ currentPage: page });
  },

  updatePage: async (id: string, updates: { title?: string; icon?: string }) => {
    await database.write(async () => {
      const page = await database.get<Page>('pages').find(id);
      await page.update((p) => {
        if (updates.title !== undefined) p.title = updates.title;
        if (updates.icon !== undefined) p.icon = updates.icon;
      });
    });

    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, ...updates } as Page : p
      ),
      currentPage:
        state.currentPage?.id === id
          ? { ...state.currentPage, ...updates } as Page
          : state.currentPage,
    }));
  },

  deletePage: async (id: string) => {
    await database.write(async () => {
      const page = await database.get<Page>('pages').find(id);

      // Delete all blocks in page
      const blocks = await database
        .get<Block>('blocks')
        .query(Q.where('page_id', id))
        .fetch();

      for (const block of blocks) {
        await block.destroyPermanently();
      }

      // Delete child pages recursively
      const childPages = await database
        .get<Page>('pages')
        .query(Q.where('parent_id', id))
        .fetch();

      for (const child of childPages) {
        await get().deletePage(child.id);
      }

      await page.destroyPermanently();
    });

    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    }));
  },

  getChildPages: async (parentId: string) => {
    const pagesCollection = database.get<Page>('pages');
    return await pagesCollection
      .query(Q.where('parent_id', parentId))
      .fetch();
  },
}));
