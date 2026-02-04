import { create } from 'zustand';
import { database, Workspace, Page } from '@/database';
import { Q } from '@nozbe/watermelondb';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, icon?: string) => Promise<Workspace>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null,

  loadWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspacesCollection = database.get<Workspace>('workspaces');
      const workspaces = await workspacesCollection.query().fetch();

      set({ workspaces, isLoading: false });

      if (workspaces.length > 0 && !get().currentWorkspace) {
        set({ currentWorkspace: workspaces[0] });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workspaces',
        isLoading: false
      });
    }
  },

  createWorkspace: async (name: string, icon?: string) => {
    const workspacesCollection = database.get<Workspace>('workspaces');

    const newWorkspace = await database.write(async () => {
      return await workspacesCollection.create((workspace) => {
        workspace.name = name;
        if (icon) workspace.icon = icon;
      });
    });

    set((state) => ({
      workspaces: [...state.workspaces, newWorkspace],
      currentWorkspace: state.currentWorkspace ?? newWorkspace,
    }));

    return newWorkspace;
  },

  setCurrentWorkspace: (workspace: Workspace) => {
    set({ currentWorkspace: workspace });
  },

  deleteWorkspace: async (id: string) => {
    await database.write(async () => {
      const workspace = await database.get<Workspace>('workspaces').find(id);

      // Delete all pages in workspace
      const pages = await database
        .get<Page>('pages')
        .query(Q.where('workspace_id', id))
        .fetch();

      for (const page of pages) {
        await page.destroyPermanently();
      }

      await workspace.destroyPermanently();
    });

    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace:
        state.currentWorkspace?.id === id
          ? state.workspaces.find((w) => w.id !== id) ?? null
          : state.currentWorkspace,
    }));
  },
}));
