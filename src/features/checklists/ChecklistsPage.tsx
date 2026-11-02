import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Download, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardBody, CardFoot, CardHead } from '../../components/Card';
import { Button } from '../../components/Button';
import { Field, Input } from '../../components/Field';
import { DocumentPreview } from '../../components/DocumentPreview';
import { SavedItems } from '../../components/SavedItems';
import { useToast } from '../../components/Toast';
import { useToolItem, useToolItems } from '../../hooks/useToolItems';
import { useWorkspace } from '../../lib/store';
import { buildChecklistMarkdown } from '../../lib/exporters';
import { checklistProgress, createDefaultChecklist } from '../../lib/defaults';
import { downloadText } from '../../lib/io';
import { createId, slugify, todayIsoDate } from '../../lib/id';
import type { ChecklistData, ChecklistSection } from '../../lib/types';

function toSections(data: Partial<ChecklistData>): ChecklistSection[] {
  if (!Array.isArray(data.sections)) return createDefaultChecklist().sections;
  return data.sections.map((section) => ({
    id: section.id ?? createId(),
    title: section.title ?? 'Checklist',
    items: Array.isArray(section.items)
      ? section.items.map((item) => ({
          id: item.id ?? createId(),
          label: item.label ?? '',
          done: Boolean(item.done),
        }))
      : [],
  }));
}

export function ChecklistsPage() {
  const items = useToolItems<ChecklistData>('checklist');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<ChecklistSection[]>(() => createDefaultChecklist().sections);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('checklist', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSections(toSections(item.data as Partial<ChecklistData>));
  });

  const progress = checklistProgress({ sections });
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
  const hasContent = title.trim().length > 0 || sections.some((section) => section.items.length > 0);
  const markdown = hasContent ? buildChecklistMarkdown(title, { sections }) : '';

  const autoSave = (next: ChecklistSection[]) => {
    if (!editingId) return;
    const finalTitle = title.trim() || `Delivery checklist — ${todayIsoDate()}`;
    updateItem(editingId, finalTitle, { sections: next });
  };

  const setAndMaybeSave = (next: ChecklistSection[], save: boolean) => {
    setSections(next);
    if (save) autoSave(next);
  };

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setSections(createDefaultChecklist().sections);
    clearItemParam();
  };

  const handleSave = () => {
    if (!title.trim()) {
      notify('Give this checklist a title before saving.', 'error');
      return;
    }
    if (editingId) {
      updateItem(editingId, title, { sections });
      notify('Checklist progress saved.');
    } else {
      const id = addItem('checklist', title, { sections });
      setEditingId(id);
      notify('Checklist saved. Future ticks save automatically.');
    }
  };

  const handleExport = () => {
    downloadText(
      `${slugify(title || 'delivery-checklist')}.md`,
      buildChecklistMarkdown(title, { sections }),
      'text/markdown;charset=utf-8',
    );
    notify('Checklist exported as Markdown.');
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    const next = sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item,
            ),
          }
        : section,
    );
    setAndMaybeSave(next, true);
  };

  const updateSectionTitle = (sectionId: string, value: string) => {
    setSections((current) =>
      current.map((section) => (section.id === sectionId ? { ...section, title: value } : section)),
    );
  };

  const updateItemLabel = (sectionId: string, itemId: string, value: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) => (item.id === itemId ? { ...item, label: value } : item)),
            }
          : section,
      ),
    );
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      { id: createId(), title: 'New section', items: [] },
    ]);
  };

  const addChecklistItem = (sectionId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [...section.items, { id: createId(), label: '', done: false }],
            }
          : section,
      ),
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Pull Request & Delivery Checklist"
        title="Do not ship on hope"
        description="Work through code review, testing, security, deployment and release gates. Ticks save to this browser once the checklist has a name."
        actions={
          <>
            {editingId ? (
              <Button icon={<Plus size={16} />} onClick={reset}>
                New checklist
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
              title={editingId ? 'Edit checklist' : 'New checklist'}
              description="Rename sections, reword items, add your own gates or remove what does not apply."
              actions={
                <Button size="sm" icon={<RotateCcw size={15} />} onClick={() => {
                  setSections(createDefaultChecklist().sections);
                  notify('Sections reset to the default template. Save to keep the change.', 'info');
                }}>
                  Reset to template
                </Button>
              }
            />
            <CardBody>
              <Field label="Checklist title" htmlFor="cl-title" required hint="For example “SDLC Desk v1.0 release” or “Sprint 24 — payments”.">
                <Input
                  id="cl-title"
                  value={title}
                  placeholder="SDLC Desk v1.0 release"
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={140}
                />
              </Field>

              <div className="progress progress--large">
                <div className="progress__meta">
                  <span>
                    {progress.done} of {progress.total} complete
                  </span>
                  <strong>{percent}%</strong>
                </div>
                <div
                  className="progress__track"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Checklist completion"
                >
                  <div className="progress__bar" style={{ width: `${percent}%` }} />
                </div>
              </div>

              <div className="checklist">
                {sections.map((section) => {
                  const sectionDone = section.items.filter((item) => item.done).length;
                  return (
                    <section className="check-section" key={section.id} aria-label={section.title}>
                      <div className="check-section__head">
                        <input
                          className="check-section__title"
                          value={section.title}
                          aria-label="Section title"
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        />
                        <span className="check-section__count">
                          {sectionDone}/{section.items.length}
                        </span>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          aria-label={`Delete section ${section.title}`}
                          onClick={() => {
                            setSections((current) => current.filter((item) => item.id !== section.id));
                            notify('Section removed from the editor.', 'info');
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {section.items.length === 0 ? (
                        <p className="muted small">No items in this section yet.</p>
                      ) : (
                        <ul className="check-list">
                          {section.items.map((item) => (
                            <li className="check-item" key={item.id}>
                              <input
                                type="checkbox"
                                className="check-item__checkbox"
                                checked={item.done}
                                aria-label={`Mark “${item.label || 'untitled item'}” complete`}
                                onChange={() => toggleItem(section.id, item.id)}
                              />
                              <input
                                className={[
                                  'check-item__label',
                                  item.done ? 'check-item__label--done' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                value={item.label}
                                aria-label="Checklist item"
                                placeholder="Describe the check…"
                                onChange={(event) => updateItemLabel(section.id, item.id, event.target.value)}
                              />
                              <button
                                type="button"
                                className="icon-btn icon-btn--danger"
                                aria-label="Delete checklist item"
                                onClick={() => {
                                  setSections((current) =>
                                    current.map((candidate) =>
                                      candidate.id === section.id
                                        ? {
                                            ...candidate,
                                            items: candidate.items.filter((entry) => entry.id !== item.id),
                                          }
                                        : candidate,
                                    ),
                                  );
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button size="sm" icon={<Plus size={14} />} onClick={() => addChecklistItem(section.id)}>
                        Add item
                      </Button>
                    </section>
                  );
                })}
              </div>

              <Button icon={<Plus size={15} />} onClick={addSection}>
                Add section
              </Button>
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Save progress' : 'Save checklist'}
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">
                {editingId ? 'Ticks save automatically.' : 'Save once, then ticks save automatically.'}
              </span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead
              title={`Saved checklists (${items.length})`}
              description="One checklist per release, sprint or pull request. Open one to keep working through it."
            />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) navigate(`/checklists?item=${item.id}`);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Checklist deleted.', 'info');
                }}
                emptyTitle="No checklists saved"
                emptyDescription="Start from the default review, testing, security, deployment and release gates, or tailor your own."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <div className="checklist-note">
            <Check size={16} aria-hidden="true" />
            <span>
              {progress.done === progress.total && progress.total > 0
                ? 'Every item is complete. Export the evidence and record the go decision.'
                : 'Complete each gate honestly. Unticked items are visible in the Markdown export.'}
            </span>
          </div>
          <DocumentPreview content={markdown} filename={`${slugify(title || 'delivery-checklist')}.md`} />
        </aside>
      </div>
    </>
  );
}
