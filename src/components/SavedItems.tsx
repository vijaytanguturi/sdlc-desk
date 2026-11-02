import { useState } from 'react';
import { ExternalLink, FolderOpen, Trash2 } from 'lucide-react';
import type { WorkItem } from '../lib/types';
import { TOOL_META } from '../lib/toolMeta';
import { relativeTime } from '../lib/id';
import { Badge } from './Badge';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';

export function SavedItems({
  items,
  onOpen,
  onDelete,
  emptyTitle = 'No saved items yet',
  emptyDescription = 'Save your first item and it will appear here. Everything stays in this browser.',
}: {
  items: WorkItem[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [pendingDelete, setPendingDelete] = useState<WorkItem | null>(null);

  const confirmDelete = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    }
  };

  if (items.length === 0) {
    return <EmptyState icon={<FolderOpen size={22} />} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <ul className="saved">
        {items.map((item) => (
          <li className="saved__row" key={item.id}>
            <div className="saved__main">
              <div className="saved__title">{item.title}</div>
              <div className="saved__meta">
                <Badge tone="brand">{TOOL_META[item.tool].shortName}</Badge>
                <span>Updated {relativeTime(item.updatedAt)}</span>
              </div>
            </div>
            <div className="saved__actions">
              <Button
                size="sm"
                icon={<ExternalLink size={14} />}
                onClick={() => onOpen(item.id)}
                aria-label={`Open ${item.title}`}
              >
                Open
              </Button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label={`Delete ${item.title}`}
                onClick={() => setPendingDelete(item)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={pendingDelete !== null}
        title="Delete saved item?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p>
          <strong>{pendingDelete?.title}</strong> will be removed from this browser. This cannot be
          undone. Export the item first if you still need a copy.
        </p>
      </Modal>
    </>
  );
}
