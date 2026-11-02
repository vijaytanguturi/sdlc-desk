import { beforeEach, describe, expect, it } from 'vitest';
import { resetWorkspaceForTests, useWorkspace } from './store';
import { WORKSPACE_KEY } from './storage';

function store() {
  return useWorkspace.getState();
}

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspaceForTests();
});

describe('workspace store', () => {
  it('adds an item, persists it and returns its id', () => {
    const id = store().addItem('requirement', 'Bulk approval', { objective: 'Faster close' });
    const items = store().items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(id);
    expect(items[0].title).toBe('Bulk approval');
    const raw = window.localStorage.getItem(WORKSPACE_KEY);
    expect(raw).toContain('Bulk approval');
  });

  it('updates an existing item and keeps its identity', () => {
    const id = store().addItem('bug', 'Timeout', { severity: 'Major' });
    store().updateItem(id, 'Timeout on staging', { severity: 'Critical' });
    const item = store().items[0];
    expect(item.id).toBe(id);
    expect(item.title).toBe('Timeout on staging');
    expect((item.data as { severity: string }).severity).toBe('Critical');
    expect(item.updatedAt >= item.createdAt).toBe(true);
  });

  it('removes an item', () => {
    const id = store().addItem('standup', 'Daily', { date: '2026-11-02' });
    store().removeItem(id);
    expect(store().items).toHaveLength(0);
  });

  it('trims titles and falls back for empty titles', () => {
    store().addItem('release', '   ', {});
    expect(store().items[0].title).toBe('Untitled');
  });

  it('persists the theme preference without touching items', () => {
    store().addItem('bug', 'One', {});
    store().setTheme('dark');
    expect(store().settings.theme).toBe('dark');
    expect(store().items).toHaveLength(1);
    const saved = JSON.parse(window.localStorage.getItem(WORKSPACE_KEY) ?? '{}');
    expect(saved.settings.theme).toBe('dark');
  });

  it('imports a valid backup and replaces the workspace', () => {
    store().addItem('bug', 'Old item', {});
    const backup = JSON.stringify({
      version: 1,
      settings: { theme: 'light' },
      items: [
        {
          id: 'imported-1',
          tool: 'requirement',
          title: 'Imported requirement',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
          data: { objective: 'Imported' },
        },
      ],
    });
    const result = store().importWorkspace(backup);
    expect(result).toEqual({ ok: true, count: 1 });
    expect(store().items).toHaveLength(1);
    expect(store().items[0].title).toBe('Imported requirement');
    expect(store().settings.theme).toBe('light');
  });

  it('rejects an import with no valid items', () => {
    const result = store().importWorkspace(JSON.stringify({ version: 1, items: [] }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no valid work items/i);
  });

  it('rejects corrupt import files without changing existing work', () => {
    store().addItem('bug', 'Keep me', {});
    const result = store().importWorkspace('{oops');
    expect(result.ok).toBe(false);
    expect(store().items).toHaveLength(1);
    expect(store().items[0].title).toBe('Keep me');
  });

  it('clears all items but keeps the theme', () => {
    store().addItem('bug', 'One', {});
    store().setTheme('dark');
    store().clearAll();
    expect(store().items).toHaveLength(0);
    expect(store().settings.theme).toBe('dark');
  });
});
