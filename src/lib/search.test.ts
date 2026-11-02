import { describe, expect, it } from 'vitest';
import { filterItems, itemMatchesQuery } from './search';
import type { WorkItem } from './types';

const requirement: WorkItem = {
  id: 'r1',
  tool: 'requirement',
  title: 'Bulk approve expense claims',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  data: {
    objective: 'Close month-end faster',
    functional: ['Select up to 50 claims'],
    acceptance: ['One audit entry'],
  },
};

const bug: WorkItem = {
  id: 'b1',
  tool: 'bug',
  title: 'Approval timeout on staging',
  createdAt: '2026-11-01T11:00:00.000Z',
  updatedAt: '2026-11-01T11:00:00.000Z',
  data: { environment: 'Chrome', steps: ['Select 50 claims', 'Click approve'], notes: 'API 504' },
};

describe('search', () => {
  it('matches titles case-insensitively', () => {
    expect(itemMatchesQuery(requirement, 'BULK')).toBe(true);
  });

  it('matches nested arrays inside data', () => {
    expect(itemMatchesQuery(requirement, '50 claims')).toBe(true);
    expect(itemMatchesQuery(bug, 'api 504')).toBe(true);
  });

  it('requires every term to match', () => {
    expect(itemMatchesQuery(requirement, 'bulk audit')).toBe(true);
    expect(itemMatchesQuery(requirement, 'bulk payment')).toBe(false);
  });

  it('returns everything for an empty query', () => {
    expect(itemMatchesQuery(requirement, '   ')).toBe(true);
    expect(filterItems([requirement, bug], '')).toHaveLength(2);
  });

  it('filters a mixed list', () => {
    const results = filterItems([requirement, bug], 'timeout');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('b1');
  });

  it('ignores null and undefined values safely', () => {
    const sparse = { ...requirement, data: { a: null, b: undefined, c: 'value' } };
    expect(itemMatchesQuery(sparse, 'value')).toBe(true);
    expect(itemMatchesQuery(sparse, 'missing')).toBe(false);
  });
});
