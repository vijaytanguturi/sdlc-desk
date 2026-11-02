import { create } from 'zustand';
import type { Settings, ToolId, WorkItem } from './types';
import type { WorkspaceSnapshot } from './storage';
import {
  EMPTY_SETTINGS,
  loadWorkspace,
  parseWorkspace,
  saveWorkspace,
} from './storage';
import { createId, nowIso } from './id';

export interface ImportResult {
  ok: boolean;
  count: number;
  error?: string;
}

interface WorkspaceState {
  items: WorkItem[];
  settings: Settings;
  storageError: string | null;
  addItem: (tool: ToolId, title: string, data: unknown) => string;
  updateItem: (id: string, title: string, data: unknown) => void;
  removeItem: (id: string) => void;
  setTheme: (theme: Settings['theme']) => void;
  importWorkspace: (json: string) => ImportResult;
  clearAll: () => void;
  dismissStorageError: () => void;
}

const initial = loadWorkspace();

export const useWorkspace = create<WorkspaceState>((set, get) => {
  const commit = (snapshot: WorkspaceSnapshot) => {
    const result = saveWorkspace(snapshot);
    set({
      items: snapshot.items,
      settings: snapshot.settings,
      storageError: result.ok ? null : (result.error ?? null),
    });
  };

  return {
    items: initial.items,
    settings: initial.settings,
    storageError: initial.error,

    addItem(tool, title, data) {
      const timestamp = nowIso();
      const item: WorkItem = {
        id: createId(),
        tool,
        title: title.trim() || 'Untitled',
        createdAt: timestamp,
        updatedAt: timestamp,
        data,
      };
      commit({ items: [item, ...get().items], settings: get().settings });
      return item.id;
    },

    updateItem(id, title, data) {
      const timestamp = nowIso();
      commit({
        items: get().items.map((item) =>
          item.id === id
            ? { ...item, title: title.trim() || 'Untitled', data, updatedAt: timestamp }
            : item,
        ),
        settings: get().settings,
      });
    },

    removeItem(id) {
      commit({
        items: get().items.filter((item) => item.id !== id),
        settings: get().settings,
      });
    },

    setTheme(theme) {
      commit({ items: get().items, settings: { ...get().settings, theme } });
    },

    importWorkspace(json) {
      const result = parseWorkspace(json);
      if (result.error) {
        return { ok: false, count: 0, error: result.error };
      }
      if (result.items.length === 0) {
        return {
          ok: false,
          count: 0,
          error: 'No valid work items were found in that file.',
        };
      }
      commit({ items: result.items, settings: result.settings });
      return { ok: true, count: result.items.length };
    },

    clearAll() {
      commit({ items: [], settings: get().settings });
    },

    dismissStorageError() {
      set({ storageError: null });
    },
  };
});

export function resetWorkspaceForTests(): void {
  useWorkspace.setState({
    items: [],
    settings: { ...EMPTY_SETTINGS },
    storageError: null,
  });
}
