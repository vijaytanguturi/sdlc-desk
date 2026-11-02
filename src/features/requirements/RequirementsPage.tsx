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
import { useToast } from '../../components/Toast';
import { useToolItem, useToolItems } from '../../hooks/useToolItems';
import { useWorkspace } from '../../lib/store';
import { buildRequirementMarkdown } from '../../lib/exporters';
import { downloadText } from '../../lib/io';
import { slugify } from '../../lib/id';
import { PRIORITIES } from '../../lib/types';
import type { Priority, RequirementData, WorkItem } from '../../lib/types';

const EMPTY: RequirementData = {
  objective: '',
  functional: [],
  assumptions: [],
  dependencies: [],
  acceptance: [],
  priority: 'Medium',
};

function toForm(data: Partial<RequirementData>): RequirementData {
  return {
    objective: data.objective ?? '',
    functional: data.functional ?? [],
    assumptions: data.assumptions ?? [],
    dependencies: data.dependencies ?? [],
    acceptance: data.acceptance ?? [],
    priority: data.priority ?? 'Medium',
  };
}

export function RequirementsPage() {
  const items = useToolItems<RequirementData>('requirement');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [form, setForm] = useState<RequirementData>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('requirement', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setForm(toForm(item.data as Partial<RequirementData>));
  });

  const hasContent =
    title.trim().length > 0 ||
    form.objective.trim().length > 0 ||
    [form.functional, form.assumptions, form.dependencies, form.acceptance].some((list) =>
      list.some((value) => value.trim()),
    );

  const markdown = hasContent ? buildRequirementMarkdown(title, form) : '';

  const patch = (partial: Partial<RequirementData>) => {
    setForm((current) => ({ ...current, ...partial }));
  };

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setForm({ ...EMPTY, functional: [], assumptions: [], dependencies: [], acceptance: [] });
    clearItemParam();
  };

  const handleSave = () => {
    if (!title.trim()) {
      notify('Give the requirement a title before saving.', 'error');
      return;
    }
    if (editingId) {
      updateItem(editingId, title, form);
      notify('Requirement updated.');
    } else {
      const id = addItem('requirement', title, form);
      setEditingId(id);
      notify('Requirement saved locally.');
    }
  };

  const handleExport = () => {
    downloadText(`${slugify(title || 'requirement')}.md`, buildRequirementMarkdown(title, form), 'text/markdown;charset=utf-8');
    notify('Requirement exported as Markdown.');
  };

  const openItem = (item: WorkItem) => {
    navigate(`/requirements?item=${item.id}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Requirement Builder"
        title="Shape rough notes into a clear requirement"
        description="Capture the business objective, scope, assumptions and testable acceptance criteria, then hand it to the team as Markdown."
        actions={
          <>
            {editingId ? (
              <Button icon={<Plus size={16} />} onClick={reset}>
                New requirement
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
              title={editingId ? 'Edit requirement' : 'New requirement'}
              description="Only the title is mandatory, but the more context you capture, the more useful the output."
              actions={editingId ? <span className="badge badge--success">Editing saved item</span> : null}
            />
            <CardBody>
              <Field label="Requirement title" htmlFor="req-title" required hint="Short and outcome-focused, for example “Bulk approve expense claims”.">
                <Input
                  id="req-title"
                  value={title}
                  placeholder="Bulk approve expense claims"
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={140}
                />
              </Field>

              <div className="field-row">
                <Field label="Priority" htmlFor="req-priority">
                  <Select
                    id="req-priority"
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

              <Field
                label="Business objective"
                htmlFor="req-objective"
                hint="Why does this matter? Describe the outcome, not the implementation."
              >
                <Textarea
                  id="req-objective"
                  rows={4}
                  value={form.objective}
                  placeholder="Finance approvers need to clear a backlog of expense claims at month end without opening each claim individually."
                  onChange={(event) => patch({ objective: event.target.value })}
                />
              </Field>

              <ListEditor
                label="Functional requirements"
                hint="What the system must do. One behaviour per item."
                items={form.functional}
                onChange={(functional) => patch({ functional })}
                placeholder="The approver can select up to 50 claims and approve them in one action."
                addLabel="Add functional requirement"
              />

              <ListEditor
                label="Assumptions"
                items={form.assumptions}
                onChange={(assumptions) => patch({ assumptions })}
                placeholder="Claims already pass validation before reaching the approver."
                addLabel="Add assumption"
              />

              <ListEditor
                label="Dependencies"
                items={form.dependencies}
                onChange={(dependencies) => patch({ dependencies })}
                placeholder="Approval service API v2 must be available."
                addLabel="Add dependency"
              />

              <ListEditor
                label="Acceptance criteria"
                hint="Testable statements. These become checkboxes in the export."
                items={form.acceptance}
                onChange={(acceptance) => patch({ acceptance })}
                placeholder="Given 50 eligible claims, when the approver confirms, then all 50 move to Approved."
                addLabel="Add acceptance criterion"
              />
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Update requirement' : 'Save requirement'}
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">Saved in this browser only.</span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead
              title={`Saved requirements (${items.length})`}
              description="Open an item to edit it, or delete it permanently from this browser."
            />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) openItem(item);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Requirement deleted.', 'info');
                }}
                emptyTitle="No requirements saved yet"
                emptyDescription="Fill in the form above and save your first requirement. It will appear here and in the library."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <DocumentPreview content={markdown} filename={`${slugify(title || 'requirement')}.md`} />
        </aside>
      </div>
    </>
  );
}
