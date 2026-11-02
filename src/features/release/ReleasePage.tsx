import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Save } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardBody, CardFoot, CardHead } from '../../components/Card';
import { Button } from '../../components/Button';
import { Field, Input } from '../../components/Field';
import { ListEditor } from '../../components/ListEditor';
import { DocumentPreview } from '../../components/DocumentPreview';
import { SavedItems } from '../../components/SavedItems';
import { useToast } from '../../components/Toast';
import { useToolItem, useToolItems } from '../../hooks/useToolItems';
import { useWorkspace } from '../../lib/store';
import { buildReleaseMarkdown } from '../../lib/exporters';
import { downloadText } from '../../lib/io';
import { slugify, todayIsoDate } from '../../lib/id';
import type { ReleaseData } from '../../lib/types';

const EMPTY: ReleaseData = {
  version: '',
  date: todayIsoDate(),
  features: [],
  fixes: [],
  enhancements: [],
  knownIssues: [],
  deployment: [],
};

function toForm(data: Partial<ReleaseData>): ReleaseData {
  return {
    version: data.version ?? '',
    date: data.date ?? todayIsoDate(),
    features: data.features ?? [],
    fixes: data.fixes ?? [],
    enhancements: data.enhancements ?? [],
    knownIssues: data.knownIssues ?? [],
    deployment: data.deployment ?? [],
  };
}

export function ReleasePage() {
  const items = useToolItems<ReleaseData>('release');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [form, setForm] = useState<ReleaseData>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('release', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setForm(toForm(item.data as Partial<ReleaseData>));
  });

  const patch = (partial: Partial<ReleaseData>) => setForm((current) => ({ ...current, ...partial }));

  const hasContent =
    title.trim().length > 0 ||
    form.version.trim().length > 0 ||
    [form.features, form.fixes, form.enhancements, form.knownIssues, form.deployment].some((list) =>
      list.some((entry) => entry.trim()),
    );

  const markdown = hasContent ? buildReleaseMarkdown(title, form) : '';
  const displayName = form.version.trim() || title.trim() || 'release-notes';

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setForm({ ...EMPTY, date: todayIsoDate(), features: [], fixes: [], enhancements: [], knownIssues: [], deployment: [] });
    clearItemParam();
  };

  const handleSave = () => {
    if (!title.trim() && !form.version.trim()) {
      notify('Add a release title or version before saving.', 'error');
      return;
    }
    const finalTitle = title.trim() || `Release ${form.version.trim()}`;
    if (editingId) {
      updateItem(editingId, finalTitle, form);
      notify('Release notes updated.');
    } else {
      const id = addItem('release', finalTitle, form);
      setEditingId(id);
      setTitle(finalTitle);
      notify('Release notes saved locally.');
    }
  };

  const handleExport = () => {
    downloadText(
      `${slugify(displayName)}.md`,
      buildReleaseMarkdown(title, form),
      'text/markdown;charset=utf-8',
    );
    notify('Release notes exported as Markdown.');
  };

  return (
    <>
      <PageHeader
        eyebrow="Release Notes Builder"
        title="Publish notes people actually read"
        description="Group what shipped, what was fixed, what changed, what is still open and how to deploy it."
        actions={
          <>
            {editingId ? (
              <Button icon={<Plus size={16} />} onClick={reset}>
                New release
              </Button>
            ) : null}
            <Button variant="primary" icon={<Download size={16} />} onClick={handleExport} disabled={!hasContent}>
              Export Markdown
            </Button>
          </>
        }
      />

      <div className="tool-grid">
        <div className="tool-grid__main">
          <Card>
            <CardHead
              title={editingId ? 'Edit release notes' : 'New release notes'}
              description="Write for users first, then for the team running the deployment."
              actions={editingId ? <span className="badge badge--success">Editing saved item</span> : null}
            />
            <CardBody>
              <div className="field-row">
                <Field label="Release title" htmlFor="rel-title" required hint="For example “Spring release” or “SDLC Desk 1.2”.">
                  <Input
                    id="rel-title"
                    value={title}
                    placeholder="SDLC Desk 1.2"
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={140}
                  />
                </Field>
                <Field label="Version" htmlFor="rel-version" hint="Used in the document heading when provided.">
                  <Input
                    id="rel-version"
                    value={form.version}
                    placeholder="1.2.0"
                    onChange={(event) => patch({ version: event.target.value })}
                    maxLength={40}
                  />
                </Field>
              </div>

              <Field label="Release date" htmlFor="rel-date">
                <Input
                  id="rel-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => patch({ date: event.target.value })}
                />
              </Field>

              <ListEditor
                label="Features delivered"
                hint="User-visible outcomes, not internal tickets."
                items={form.features}
                onChange={(features) => patch({ features })}
                placeholder="Approvers can now clear up to 50 expense claims in one action."
                addLabel="Add feature"
                rows={2}
              />

              <ListEditor
                label="Defects fixed"
                items={form.fixes}
                onChange={(fixes) => patch({ fixes })}
                placeholder="Bulk approval no longer times out on large selections."
                addLabel="Add fix"
                rows={2}
              />

              <ListEditor
                label="Enhancements"
                items={form.enhancements}
                onChange={(enhancements) => patch({ enhancements })}
                placeholder="Improved empty-state messaging on the claims list."
                addLabel="Add enhancement"
                rows={2}
              />

              <ListEditor
                label="Known issues"
                hint="Be explicit about impact and workarounds."
                items={form.knownIssues}
                onChange={(knownIssues) => patch({ knownIssues })}
                placeholder="Audit export is delayed by up to 10 minutes for very large tenants. No workaround required."
                addLabel="Add known issue"
                rows={2}
              />

              <ListEditor
                label="Deployment notes"
                items={form.deployment}
                onChange={(deployment) => patch({ deployment })}
                placeholder="Run migration 0042 before deploying. Roll back by reverting the feature flag."
                addLabel="Add deployment note"
                rows={2}
              />
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Update release' : 'Save release'}
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">Saved in this browser only.</span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead title={`Saved release notes (${items.length})`} description="Reuse a previous release as the starting point for the next one." />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) navigate(`/release-notes?item=${item.id}`);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Release notes deleted.', 'info');
                }}
                emptyTitle="No release notes yet"
                emptyDescription="Assemble your first release note above. Markdown export is ready for tickets, wikis or email."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <DocumentPreview content={markdown} filename={`${slugify(displayName)}.md`} />
        </aside>
      </div>
    </>
  );
}
