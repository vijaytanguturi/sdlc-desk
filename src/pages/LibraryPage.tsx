import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useWorkspace } from '../lib/store';
import { TOOL_LIST, TOOL_META } from '../lib/toolMeta';
import { TOOL_IDS } from '../lib/types';
import type { ToolId } from '../lib/types';
import { filterItems } from '../lib/search';
import { PageHeader } from '../components/PageHeader';
import { Card, CardBody } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { SavedItems } from '../components/SavedItems';
import { useToast } from '../components/toastContext';
import { FolderOpen } from 'lucide-react';

type Filter = 'all' | ToolId;

export function LibraryPage() {
  const items = useWorkspace((state) => state.items);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const results = useMemo(() => {
    const scoped = filter === 'all' ? items : items.filter((item) => item.tool === filter);
    return filterItems(scoped, query).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, filter, query]);

  const handleDelete = (id: string) => {
    removeItem(id);
    notify('Item deleted.', 'info');
  };

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Saved work"
        description="Search everything you have captured. Titles and content both match, and results stay on this device."
      />

      <Card>
        <CardBody>
          <div className="library-toolbar">
            <div className="search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="search__input"
                placeholder="Search titles, requirements, steps, notes…"
                aria-label="Search saved work"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <p className="library-count" aria-live="polite">
              {results.length} {results.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="chips" role="group" aria-label="Filter by tool">
            <button
              type="button"
              className={`chip ${filter === 'all' ? 'chip--active' : ''}`}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {TOOL_IDS.map((toolId) => (
              <button
                key={toolId}
                type="button"
                className={`chip ${filter === toolId ? 'chip--active' : ''}`}
                aria-pressed={filter === toolId}
                onClick={() => setFilter(toolId)}
              >
                {TOOL_META[toolId].shortName}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={22} />}
              title="Your library is empty"
              description="Save a requirement, test case set, defect, standup, release note or checklist and it will be searchable here."
              action={
                <button type="button" className="btn btn--primary" onClick={() => navigate('/requirements')}>
                  Create your first item
                </button>
              }
            />
          ) : (
            <SavedItems
              items={results}
              onOpen={(id) => {
                const item = items.find((candidate) => candidate.id === id);
                if (item) navigate(`${TOOL_META[item.tool].path}?item=${id}`);
              }}
              onDelete={handleDelete}
              emptyTitle="No matching items"
              emptyDescription="Try a different search term or clear the tool filter."
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="library-hint">
            <strong>Tip:</strong> use the tool pages to edit an item, or open it here. Deleting from the
            library removes it from this browser immediately.
          </div>
        </CardBody>
      </Card>

      <p className="muted small">
        {TOOL_LIST.length} tools · {items.length} saved items · no data leaves this browser
      </p>
    </>
  );
}
