import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Save } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardBody, CardFoot, CardHead } from '../../components/Card';
import { Button } from '../../components/Button';
import { Field, Input, Select, Textarea } from '../../components/Field';
import { ListEditor } from '../../components/ListEditor';
import { DocumentPreview } from '../../components/DocumentPreview';
import { SavedItems } from '../../components/SavedItems';
import { useToast } from '../../components/toastContext';
import { useToolItem, useToolItems } from '../../hooks/useToolItems';
import { useWorkspace } from '../../lib/store';
import { buildBugMarkdown } from '../../lib/exporters';
import { downloadText } from '../../lib/io';
import { slugify } from '../../lib/id';
import { PRIORITIES, SEVERITIES } from '../../lib/types';
import type { BugData, Priority, Severity } from '../../lib/types';

const EMPTY: BugData = {
  environment: '',
  severity: 'Major',
  priority: 'Medium',
  steps: [],
  actual: '',
  expected: '',
  notes: '',
};

function toForm(data: Partial<BugData>): BugData {
  return {
    environment: data.environment ?? '',
    severity: data.severity ?? 'Major',
    priority: data.priority ?? 'Medium',
    steps: data.steps ?? [],
    actual: data.actual ?? '',
    expected: data.expected ?? '',
    notes: data.notes ?? '',
  };
}

export function BugsPage() {
  const items = useToolItems<BugData>('bug');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [form, setForm] = useState<BugData>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('bug', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setForm(toForm(item.data as Partial<BugData>));
  });

  const hasContent =
    title.trim().length > 0 ||
    form.actual.trim().length > 0 ||
    form.expected.trim().length > 0 ||
    form.steps.some((step) => step.trim());

  const markdown = hasContent ? buildBugMarkdown(title, form) : '';

  const patch = (partial: Partial<BugData>) => setForm((current) => ({ ...current, ...partial }));

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setForm({ ...EMPTY, steps: [] });
    clearItemParam();
  };

  const handleSave = () => {
    if (!title.trim()) {
      notify('Give the defect a clear title before saving.', 'error');
      return;
    }
    if (editingId) {
      updateItem(editingId, title, form);
      notify('Defect report updated.');
    } else {
      const id = addItem('bug', title, form);
      setEditingId(id);
      notify('Defect report saved locally.');
    }
  };

  const handleExport = () => {
    downloadText(`${slugify(title || 'defect')}.md`, buildBugMarkdown(title, form), 'text/markdown;charset=utf-8');
    notify('Defect report exported as Markdown.');
  };

  return (
    <>
      <PageHeader
        eyebrow="Bug Report Builder"
        title="Write a defect a developer can act on"
        description="Capture environment, severity, reproduction steps and the difference between expected and actual behaviour."
        actions={
          <>
            {editingId ? (
              <Button icon={<Plus size={16} />} onClick={reset}>
                New defect
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
              title={editingId ? 'Edit defect report' : 'New defect report'}
              description="Be specific. A reproducible report saves a round trip with the developer."
              actions={editingId ? <span className="badge badge--success">Editing saved item</span> : null}
            />
            <CardBody>
              <Field label="Defect title" htmlFor="bug-title" required hint="State the broken behaviour, not the fix.">
                <Input
                  id="bug-title"
                  value={title}
                  placeholder="Bulk approval times out when 50 claims are selected"
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={160}
                />
              </Field>

              <Field label="Environment" htmlFor="bug-env" hint="Build, browser, OS, device, tenant or anything that narrows reproduction.">
                <Input
                  id="bug-env"
                  value={form.environment}
                  placeholder="Release 2.4.0 · Chrome 141 · Windows 11 · staging tenant EU-2"
                  onChange={(event) => patch({ environment: event.target.value })}
                />
              </Field>

              <div className="field-row">
                <Field label="Severity" htmlFor="bug-severity">
                  <Select
                    id="bug-severity"
                    value={form.severity}
                    onChange={(event) => patch({ severity: event.target.value as Severity })}
                  >
                    {SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Priority" htmlFor="bug-priority">
                  <Select
                    id="bug-priority"
                    value={form.priority}
                    onChange={(event) => patch({ priority: event.target.value as Priority })}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <ListEditor
                label="Steps to reproduce"
                hint="Start from a known state. Include the data used and the exact action."
                items={form.steps}
                onChange={(steps) => patch({ steps })}
                placeholder="Select 50 pending expense claims and choose Approve."
                addLabel="Add step"
                rows={1}
              />

              <Field label="Actual result" htmlFor="bug-actual">
                <Textarea
                  id="bug-actual"
                  rows={3}
                  value={form.actual}
                  placeholder="The page spins for 30 seconds, then shows “Request failed” and the claims stay pending."
                  onChange={(event) => patch({ actual: event.target.value })}
                />
              </Field>

              <Field label="Expected result" htmlFor="bug-expected">
                <Textarea
                  id="bug-expected"
                  rows={3}
                  value={form.expected}
                  placeholder="All 50 claims are approved within 5 seconds and an audit entry is written."
                  onChange={(event) => patch({ expected: event.target.value })}
                />
              </Field>

              <Field
                label="Supporting notes"
                htmlFor="bug-notes"
                hint="Logs, screenshots, frequency, workarounds and links to related tickets."
              >
                <Textarea
                  id="bug-notes"
                  rows={3}
                  value={form.notes}
                  placeholder="Occurs 4 out of 5 attempts. 25 claims works. No errors in the browser console; API returns 504."
                  onChange={(event) => patch({ notes: event.target.value })}
                />
              </Field>
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Update defect' : 'Save defect'}
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">Saved in this browser only.</span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead
              title={`Saved defects (${items.length})`}
              description="Your local defect log. Copy the preview into your tracker when ready."
            />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) navigate(`/bugs?item=${item.id}`);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Defect report deleted.', 'info');
                }}
                emptyTitle="No defect reports saved"
                emptyDescription="Capture your first defect above. Saved reports can be reopened and exported at any time."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <div className="severity-summary">
            <span className="badge badge--danger">Severity: {form.severity}</span>
            <span className="badge badge--warning">Priority: {form.priority}</span>
          </div>
          <DocumentPreview content={markdown} filename={`${slugify(title || 'defect')}.md`} />
        </aside>
      </div>
    </>
  );
}
