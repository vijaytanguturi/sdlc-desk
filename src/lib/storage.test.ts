import { describe, expect, it } from 'vitest';
import {
  EMPTY_SETTINGS,
  WORKSPACE_KEY,
  loadWorkspace,
  parseWorkspace,
  saveWorkspace,
  serializeWorkspace,
} from './storage';
import type { StorageAdapter } from './storage';
import type { WorkItem } from './types';

const item: WorkItem = {
  id: 'item-1',
  tool: 'requirement',
  title: 'Bulk approval',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  data: { objective: 'Approve faster', functional: ['one action'] },
};

class MemoryAdapter implements StorageAdapter {
  map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('parseWorkspace', () => {
  it('returns an empty workspace when nothing is stored', () => {
    expect(parseWorkspace(null)).toEqual({ items: [], settings: EMPTY_SETTINGS, error: null });
  });

  it('round-trips items and settings through serialization', () => {
    const raw = serializeWorkspace({ items: [item], settings: { theme: 'dark' } });
    const result = parseWorkspace(raw);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Bulk approval');
    expect(result.settings.theme).toBe('dark');
    expect(result.error).toBeNull();
  });

  it('drops invalid items but keeps valid ones', () => {
    const raw = JSON.stringify({
      version: 1,
      settings: { theme: 'light' },
      items: [
        item,
        { id: 'bad-tool', tool: 'not-a-tool', title: 'Nope', data: {} },
        { id: '', tool: 'bug', title: 'No id', data: {} },
        { id: 'no-data', tool: 'bug', title: 'No data' },
      ],
    });
    const result = parseWorkspace(raw);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('item-1');
  });

  it('falls back to default settings when they are invalid', () => {
    const raw = JSON.stringify({ version: 1, settings: { theme: 'neon' }, items: [] });
    expect(parseWorkspace(raw).settings).toEqual(EMPTY_SETTINGS);
  });

  it('reports corrupt JSON instead of throwing', () => {
    const result = parseWorkspace('{not json');
    expect(result.items).toEqual([]);
    expect(result.error).toMatch(/could not be read/i);
  });

  it('reports non-object documents', () => {
    expect(parseWorkspace('"hello"').error).toMatch(/unexpected format/i);
  });
});

describe('loadWorkspace and saveWorkspace', () => {
  it('reads and writes through an adapter', () => {
    const adapter = new MemoryAdapter();
    expect(saveWorkspace({ items: [item], settings: { theme: 'light' } }, adapter).ok).toBe(true);
    expect(adapter.map.has(WORKSPACE_KEY)).toBe(true);
    const result = loadWorkspace(adapter);
    expect(result.items).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('explains a full storage quota', () => {
    const adapter: StorageAdapter = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    const result = saveWorkspace({ items: [], settings: EMPTY_SETTINGS }, adapter);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/storage is full/i);
  });

  it('handles unavailable storage gracefully', () => {
    const adapter: StorageAdapter = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const result = loadWorkspace(adapter);
    expect(result.items).toEqual([]);
    expect(result.error).toMatch(/not available/i);
  });
});
