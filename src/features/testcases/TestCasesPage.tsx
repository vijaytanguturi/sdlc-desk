import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
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
import { buildTestCasesMarkdown, testCasesToCsv } from '../../lib/exporters';
import { ruleBasedGenerator } from '../../lib/generator';
import { downloadText } from '../../lib/io';
import { createId, slugify } from '../../lib/id';
import { PRIORITIES, TEST_TYPES } from '../../lib/types';
import type { Priority, TestCase, TestCaseSetData, TestType } from '../../lib/types';

function blankCase(): TestCase {
  return {
    id: createId(),
    scenario: '',
    type: 'Positive',
    priority: 'Medium',
    preconditions: '',
    steps: [''],
    expected: '',
  };
}

function CaseCard({
  testCase,
  index,
  onChange,
  onDelete,
}: {
  testCase: TestCase;
  index: number;
  onChange: (next: TestCase) => void;
  onDelete: () => void;
}) {
  const patch = (partial: Partial<TestCase>) => onChange({ ...testCase, ...partial });

  return (
    <div className="case-card">
      <div className="case-card__head">
        <span className="case-card__id">TC-{String(index + 1).padStart(3, '0')}</span>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          aria-label={`Delete test case ${index + 1}`}
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <Field label="Scenario" htmlFor={`case-${testCase.id}-scenario`} required>
        <Input
          id={`case-${testCase.id}-scenario`}
          value={testCase.scenario}
          placeholder="Verify the approver can approve multiple claims in one action"
          onChange={(event) => patch({ scenario: event.target.value })}
        />
      </Field>

      <div className="field-row">
        <Field label="Test type" htmlFor={`case-${testCase.id}-type`}>
          <Select
            id={`case-${testCase.id}-type`}
            value={testCase.type}
            onChange={(event) => patch({ type: event.target.value as TestType })}
          >
            {TEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor={`case-${testCase.id}-priority`}>
          <Select
            id={`case-${testCase.id}-priority`}
            value={testCase.priority}
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

      <Field label="Preconditions" htmlFor={`case-${testCase.id}-pre`}>
        <Textarea
          id={`case-${testCase.id}-pre`}
          rows={2}
          value={testCase.preconditions}
          placeholder="User is signed in as a finance approver with at least 50 pending claims."
          onChange={(event) => patch({ preconditions: event.target.value })}
        />
      </Field>

      <ListEditor
        label="Steps"
        hint="One action per step, written so another tester can repeat it."
        items={testCase.steps}
        onChange={(steps) => patch({ steps })}
        placeholder="Select 50 eligible claims."
        addLabel="Add step"
        rows={1}
      />

      <Field label="Expected result" htmlFor={`case-${testCase.id}-expected`}>
        <Textarea
          id={`case-${testCase.id}-expected`}
          rows={2}
          value={testCase.expected}
          placeholder="All 50 claims move to Approved and one audit entry records the bulk action."
          onChange={(event) => patch({ expected: event.target.value })}
        />
      </Field>
    </div>
  );
}

function toForm(data: Partial<TestCaseSetData>): TestCaseSetData {
  return {
    requirement: data.requirement ?? '',
    cases: Array.isArray(data.cases) ? data.cases : [],
  };
}

export function TestCasesPage() {
  const items = useToolItems<TestCaseSetData>('testcase');
  const addItem = useWorkspace((state) => state.addItem);
  const updateItem = useWorkspace((state) => state.updateItem);
  const removeItem = useWorkspace((state) => state.removeItem);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [cases, setCases] = useState<TestCase[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { clearItemParam } = useToolItem('testcase', (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    const data = toForm(item.data as Partial<TestCaseSetData>);
    setRequirement(data.requirement);
    setCases(data.cases);
  });

  const hasContent = title.trim().length > 0 || requirement.trim().length > 0 || cases.length > 0;
  const data: TestCaseSetData = { requirement, cases };
  const markdown = hasContent ? buildTestCasesMarkdown(title, data) : '';

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setRequirement('');
    setCases([]);
    clearItemParam();
  };

  const handleGenerate = () => {
    if (!requirement.trim()) {
      notify('Paste the requirement or user story before generating cases.', 'error');
      return;
    }
    const generated = ruleBasedGenerator.generate(requirement);
    const existing = new Set(cases.map((testCase) => testCase.scenario.trim().toLowerCase()));
    const fresh = generated.filter((testCase) => !existing.has(testCase.scenario.toLowerCase()));
    if (fresh.length === 0) {
      notify('Those starter cases are already in the list.', 'info');
      return;
    }
    setCases((current) => [...current, ...fresh]);
    notify(`${fresh.length} starter cases added. Review and tailor them before export.`);
  };

  const handleSave = () => {
    if (!title.trim()) {
      notify('Give this test case set a title before saving.', 'error');
      return;
    }
    const meaningful = cases.filter(
      (testCase) =>
        testCase.scenario.trim() ||
        testCase.expected.trim() ||
        testCase.preconditions.trim() ||
        testCase.steps.some((step) => step.trim()),
    );
    if (meaningful.length === 0) {
      notify('Add at least one test case with a scenario before saving.', 'error');
      return;
    }
    const payload: TestCaseSetData = { requirement, cases: meaningful };
    if (editingId) {
      updateItem(editingId, title, payload);
      notify('Test case set updated.');
    } else {
      const id = addItem('testcase', title, payload);
      setEditingId(id);
      setCases(meaningful);
      notify('Test case set saved locally.');
    }
  };

  const handleCsv = () => {
    if (cases.length === 0) return;
    downloadText(
      `${slugify(title || 'test-cases')}.csv`,
      testCasesToCsv(cases),
      'text/csv;charset=utf-8',
    );
    notify('Test cases exported as CSV.');
  };

  const counts = TEST_TYPES.map((type) => ({
    type,
    count: cases.filter((testCase) => testCase.type === type).length,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Test Case Generator"
        title="Turn a story into a review-ready test set"
        description="Generate a starter set from proven heuristics, then edit every field. Positive, negative, boundary and edge coverage — no AI service involved."
        actions={
          <>
            <Button icon={<Plus size={16} />} onClick={reset}>
              New set
            </Button>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={handleCsv}
              disabled={cases.length === 0}
            >
              Export CSV
            </Button>
          </>
        }
      />

      <div className="tool-grid">
        <div className="tool-grid__main">
          <Card>
            <CardHead
              title={editingId ? 'Edit test case set' : 'New test case set'}
              description="Paste the requirement, generate a starting point, then make each case specific to your product."
              actions={editingId ? <span className="badge badge--success">Editing saved item</span> : null}
            />
            <CardBody>
              <Field label="Set title" htmlFor="tc-title" required>
                <Input
                  id="tc-title"
                  value={title}
                  placeholder="Bulk claim approval — regression set"
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={140}
                />
              </Field>

              <Field
                label="Requirement or user story"
                htmlFor="tc-requirement"
                hint="Paste the story, acceptance criteria or a short description. Keywords such as login, export, upload or payment add targeted cases."
              >
                <Textarea
                  id="tc-requirement"
                  rows={5}
                  value={requirement}
                  placeholder="As a finance approver, I want to approve up to 50 expense claims in one action so that month-end close is faster."
                  onChange={(event) => setRequirement(event.target.value)}
                />
              </Field>

              <div className="generate-bar">
                <Button variant="primary" icon={<Sparkles size={16} />} onClick={handleGenerate}>
                  Generate starter cases
                </Button>
                <span className="muted small">
                  {ruleBasedGenerator.label} · runs locally · deterministic
                </span>
              </div>

              <div className="case-toolbar">
                <h3 className="section-title">Test cases ({cases.length})</h3>
                <div className="case-toolbar__actions">
                  <Button size="sm" icon={<Plus size={15} />} onClick={() => setCases([...cases, blankCase()])}>
                    Add blank case
                  </Button>
                  {cases.length > 0 ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        setCases([]);
                        notify('Test cases cleared from the editor. Save to update the item.', 'info');
                      }}
                    >
                      Clear list
                    </Button>
                  ) : null}
                </div>
              </div>

              {cases.length === 0 ? (
                <div className="inline-empty">
                  No cases yet. Generate a starter set above or add a blank case and write your own.
                </div>
              ) : (
                <div className="case-list">
                  {cases.map((testCase, index) => (
                    <CaseCard
                      key={testCase.id}
                      testCase={testCase}
                      index={index}
                      onChange={(next) =>
                        setCases((current) => current.map((item) => (item.id === next.id ? next : item)))
                      }
                      onDelete={() => {
                        setCases((current) => current.filter((item) => item.id !== testCase.id));
                        notify(`Removed TC-${String(index + 1).padStart(3, '0')}.`, 'info');
                      }}
                    />
                  ))}
                </div>
              )}
            </CardBody>
            <CardFoot>
              <div className="form-actions">
                <Button variant="primary" icon={<Save size={15} />} onClick={handleSave}>
                  {editingId ? 'Update test set' : 'Save test set'}
                </Button>
                <Button icon={<Download size={15} />} onClick={handleCsv} disabled={cases.length === 0}>
                  Export CSV
                </Button>
                {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
              </div>
              <span className="muted small">CSV includes Test ID, type, priority, steps and expected result.</span>
            </CardFoot>
          </Card>

          <Card>
            <CardHead
              title={`Saved test sets (${items.length})`}
              description="Each saved set keeps its own requirement and cases."
            />
            <CardBody>
              <SavedItems
                items={items}
                onOpen={(id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (item) navigate(`/test-cases?item=${item.id}`);
                }}
                onDelete={(id) => {
                  removeItem(id);
                  if (editingId === id) reset();
                  notify('Test case set deleted.', 'info');
                }}
                emptyTitle="No test sets saved yet"
                emptyDescription="Generate or write cases above, then save the set to reuse it later."
              />
            </CardBody>
          </Card>
        </div>

        <aside className="tool-grid__aside">
          <div className="type-summary">
            {counts.map((entry) => (
              <span className="type-summary__item" key={entry.type}>
                <span className={`dot dot--${entry.type.toLowerCase()}`} aria-hidden="true" />
                {entry.type} <strong>{entry.count}</strong>
              </span>
            ))}
          </div>
          <DocumentPreview content={markdown} filename={`${slugify(title || 'test-cases')}.md`} />
        </aside>
      </div>
    </>
  );
}
