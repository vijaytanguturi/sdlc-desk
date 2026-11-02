import type { WorkItem } from './types';

function flatten(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(flatten).join(' ');
  }
  return '';
}

export function itemSearchText(item: WorkItem): string {
  return `${item.title} ${item.tool} ${flatten(item.data)}`.toLowerCase();
}

/** Every whitespace-separated term must appear somewhere in the item. */
export function itemMatchesQuery(item: WorkItem, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = itemSearchText(item);
  return terms.every((term) => haystack.includes(term));
}

export function filterItems(items: WorkItem[], query: string): WorkItem[] {
  return items.filter((item) => itemMatchesQuery(item, query));
}
