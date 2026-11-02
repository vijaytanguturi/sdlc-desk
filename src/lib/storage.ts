import type { Settings, ToolId, WorkItem } from './types';
import { TOOL_IDS } from './types';

export const WORKSPACE_KEY = 'sdlc-desk.workspace';
export const WORKSPACE_VERSION = 1;
export const EMPTY_SETTINGS: Settings = { theme: 'system' };

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface WorkspaceSnapshot {
  items: WorkItem[];
  settings: Settings;
}

export interface LoadResult extends WorkspaceSnapshot {
  error: string | null;
}

export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    return window.localStorage.getItem(key);
  },
  setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    window.localStorage.removeItem(key);
  },
};

function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && (TOOL_IDS as string[]).includes(value);
}

function isWorkItem(value: unknown): value is WorkItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    isToolId(item.tool) &&
    typeof item.title === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string' &&
    typeof item.data === 'object' &&
    item.data !== null
  );
}

function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false;
  const theme = (value as Record<string, unknown>).theme;
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

/**
 * Parse a raw workspace document. Unknown or corrupt entries are dropped
 * instead of failing the whole workspace, so one bad item cannot lock a user out.
 */
export function parseWorkspace(raw: string | null): LoadResult {
  if (!raw) {
    return { items: [], settings: { ...EMPTY_SETTINGS }, error: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      items: [],
      settings: { ...EMPTY_SETTINGS },
      error: 'Saved data could not be read. Export the browser storage before making changes.',
    };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      items: [],
      settings: { ...EMPTY_SETTINGS },
      error: 'Saved data had an unexpected format, so it was not loaded.',
    };
  }
  const doc = parsed as Record<string, unknown>;
  const items = Array.isArray(doc.items) ? doc.items.filter(isWorkItem) : [];
  const settings = isSettings(doc.settings) ? doc.settings : { ...EMPTY_SETTINGS };
  return { items, settings, error: null };
}

export function loadWorkspace(adapter: StorageAdapter = localStorageAdapter): LoadResult {
  try {
    return parseWorkspace(adapter.getItem(WORKSPACE_KEY));
  } catch {
    return {
      items: [],
      settings: { ...EMPTY_SETTINGS },
      error: 'Browser storage is not available. Changes will not be saved.',
    };
  }
}

export function serializeWorkspace(snapshot: WorkspaceSnapshot): string {
  return JSON.stringify({
    version: WORKSPACE_VERSION,
    savedAt: new Date().toISOString(),
    items: snapshot.items,
    settings: snapshot.settings,
  });
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

export function saveWorkspace(
  snapshot: WorkspaceSnapshot,
  adapter: StorageAdapter = localStorageAdapter,
): SaveResult {
  try {
    adapter.setItem(WORKSPACE_KEY, serializeWorkspace(snapshot));
    return { ok: true };
  } catch (error) {
    const quotaExceeded =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: quotaExceeded
        ? 'Browser storage is full. Export your work and delete old items to free space.'
        : 'Changes could not be saved to this browser.',
    };
  }
}
