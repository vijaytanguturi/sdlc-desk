import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../lib/store';
import type { ToolId, WorkItem } from '../lib/types';

/** Items for one tool, newest first. */
export function useToolItems<T = unknown>(tool: ToolId): WorkItem<T>[] {
  const items = useWorkspace((state) => state.items);
  return useMemo(
    () =>
      items
        .filter((item) => item.tool === tool)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as WorkItem<T>[],
    [items, tool],
  );
}

/**
 * Loads an item referenced by the `?item=` query parameter exactly once per id.
 * The callback is kept in a ref so callers can pass inline functions safely.
 */
export function useToolItem(
  tool: ToolId,
  onLoad: (item: WorkItem) => void,
): { itemId: string | null; clearItemParam: () => void } {
  const [searchParams, setSearchParams] = useSearchParams();
  const itemId = searchParams.get('item');
  const loadRef = useRef(onLoad);
  useEffect(() => {
    loadRef.current = onLoad;
  });

  useEffect(() => {
    if (!itemId) return;
    const item = useWorkspace
      .getState()
      .items.find((candidate) => candidate.id === itemId && candidate.tool === tool);
    if (item) loadRef.current(item);
  }, [itemId, tool]);

  const clearItemParam = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('item');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return { itemId, clearItemParam };
}
