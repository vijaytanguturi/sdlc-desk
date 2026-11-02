import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, History, Plus, Save } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardBody, CardFoot, CardHead } from '../../components/Card';
import { Button } from '../../components/Button';
import { Field, Input } from '../../components/Field';
import { ListEditor } from '../../components/ListEditor';
import { DocumentPreview } from '../../components/DocumentPreview';
import { SavedItems } from '../../components/SavedItems';
import { useToast } from '../../components/toastContext';
import { useToolItem, useToolItems } from '../../hooks/useToolItems';
import { useWorkspace } from '../../lib/store';
import { buildStandupMarkdown } from '../../lib/exporters';
import { downloadText } from '../../lib/io';
import { slugify, todayIsoDate } from '../../lib/id';
import type { StandupData } from '../../lib/types';

const EMPTY: StandupData = {
  date: todayIsoDate(),
  yesterday: [],
  today: [],
  blockers: [],
};

function toForm(data: Partial<StandupData>): StandupData {
  return {
    date: data.date ?? todayIsoDate(),
    yesterday: data.yesterday ?? [],
    today: data.today ?? [],
    blockers: data.blockers ?? [],
  };
}

export function StandupPage() {
  const items = useToolItems<StandupData>('standup');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [form, setForm] = useState<StandupData>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('standup', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setForm(toForm(item.data as Partial<StandupData>));
  });

  const patch = (partial: Partial<StandupData>) => setForm((current) => ({ ...current, ...partial }));
  const defaultTitle = `Daily standup — ${form.date || todayIsoDate()}`;

  const hasContent =
    form.yesterday.some((entry) => entry.trim()) ||
    form.today.some((entry) => entry.trim()) ||
    form.blockers.some((entry) => entry.trim());

  const markdown = hasContent || title.trim() ? buildStandupMarkdown(title || defaultTitle, form) : '';
  const filename = `${slugify(title || defaultTitle)}.md`;

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setForm({ ...EMPTY, date: todayIsoDate(), yesterday: [], today: [], blockers: [] });
    clearItemParam();
  };

  const handleSave = () => {
    if (!hasContent) {
      notify('Add at least one update, plan or blocker before saving.', 'error');
      return;
    }
    const finalTitle = title.trim() || defaultTitle;
    if (editingId) {
      updateItem(editingId, finalTitle, form);
      notify('Standup entry updated.');
    } else {
      const id = addItem('standup', finalTitle, form);
      setEditingId(id);
      setTitle(finalTitle);
      notify('Standup entry saved locally.');
    }
  };

  const handleExport = () => {
    downloadText(filename, buildStandupMarkdown(title || defaultTitle, form), 'text/markdown;charset=utf-8');
    notify('Standup exported as Markdown.');
  };

  const importLatest = () => {
    const latest = items.find((item) => item.id !== editingId);
    if (!latest) {
      notify('No earlier standup to carry forward yet.', 'info');
      return;
    }
    const data = latest.data as Partial<StandupData>;
    patch({
      yesterday: (data.today ?? []).filter((entry) => entry.trim()),
      blockers: (data.blockers ?? []).filter((entry) => entry.trim()),
    });
    notify('Carried forward the latest plan as yesterday’s work.', 'info');
  };

  return (
    <>
      <PageHeader
        eyebrow="Daily Standup"
        title="A crisp update in under a minute"
        description="Record what moved, what is next and what is blocked. Keep a local history you can copy into chat or a tracker."
        actions={
          <>
            {editingId ? (
              <Button icon={<Plus size={16} />} onClick={reset}>
                New entry
              </Button>
            ) : null}
            <Button variant="primary" icon={<Download size={16} />} onClick={handleExport} disabled={!markdown}>
              Export Markdown
            </Button>
          </>
        }
      />

      <div className="tool-grid">
        <div className="tool-grid__main">
          <Card>
            <CardHead
              title={editingId ? 'Edit standup entry' : 'New standup entry'}
              description="Write for a reader who was not in yesterday's conversation."
              actions={
                <Button size="sm" icon={<History size={15} />} onClick={importLatest}>
                  Carry forward last plan
                </Button>
              }
            />
            <CardBody>
              <div className="field-row">
                <Field label="Date" htmlFor="standup-date">
                  <Input
                    id="standup-date"
                    type="date"
                    value={form.date}
                    onChange={(event) => patch({ date: event.target.value })}
                  />
                </Field>
                <Field label="Title (optional)" htmlFor="standup-title" hint="Leave blank to use the date.">
                  <Input
                    id="standup-title"
                    value={title}
                    placeholder={defaultTitle}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={140}
                  />
                </Field>
              </div>

              <ListEditor
                label="Yesterday’s accomplishments"
                hint="Outcomes, not activity. Link tickets where useful."
                items={form.yesterday}
                onChange={(yesterday) => patch({ yesterday })}
                placeholder="Finished bulk-approval API and added regression tests (SDLC-142)."
                addLabel="Add accomplishment"
                rows={2}
              />

              <ListEditor
                label="Today’s plan"
                items={form.today}
                onChange={(today) => patch({ today })}
                placeholder="Pair with QA on the approval audit trail."
                addLabel="Add plan item"
                rows={2}
              />

              <ListEditor
                label="Blockers and dependencies"
                hint="Name the owner and what you need, so the standup can unblock you."
                items={form.blockers}
                onChange={(blockers) => patch({ blockers })}
                placeholder="Waiting on staging database access from platform team (Priya)."
                addLabel="Add blocker"
                rows={2}
              />
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Update entry' : 'Save entry'}
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">Local history only.</span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead
              title={`Standup history (${items.length})`}
              description="Open any entry to update it, or delete entries you no longer need."
            />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) navigate(`/standup?item=${item.id}`);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Standup entry deleted.', 'info');
                }}
                emptyTitle="No standups recorded"
                emptyDescription="Write today's update and save it. The next entry can carry yesterday's plan forward automatically."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <DocumentPreview content={markdown} filename={filename} />
        </aside>
      </div>
    </>
  );
}
