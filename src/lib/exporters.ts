import type {
  BugData,
  ChecklistData,
  ReleaseData,
  RequirementData,
  StandupData,
  TestCase,
  TestCaseSetData,
} from './types';

function bullets(values: string[], fallback = '_None._'): string {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (clean.length === 0) return fallback;
  return clean.map((value) => `- ${value}`).join('\n');
}

function numbered(values: string[], fallback = '_Not provided._'): string {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (clean.length === 0) return fallback;
  return clean.map((value, index) => `${index + 1}. ${value}`).join('\n');
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}\n`;
}

export function buildRequirementMarkdown(title: string, data: RequirementData): string {
  const acceptance =
    data.acceptance.some((value) => value.trim())
      ? data.acceptance
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => `- [ ] ${value}`)
          .join('\n')
      : '_None captured._';

  return [
    `# ${title.trim() || 'Untitled requirement'}`,
    '',
    `**Priority:** ${data.priority}`,
    '',
    section('Business objective', data.objective.trim() || '_Not captured._'),
    section('Functional requirements', numbered(data.functional)),
    section('Assumptions', bullets(data.assumptions)),
    section('Dependencies', bullets(data.dependencies)),
    `## Acceptance criteria\n\n${acceptance}\n`,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

export function buildBugMarkdown(title: string, data: BugData): string {
  return [
    `# Defect: ${title.trim() || 'Untitled defect'}`,
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| Severity | ${data.severity} |`,
    `| Priority | ${data.priority} |`,
    `| Environment | ${data.environment.trim() || 'Not specified'} |`,
    '',
    section('Steps to reproduce', numbered(data.steps)),
    section('Actual result', data.actual.trim() || '_Not provided._'),
    section('Expected result', data.expected.trim() || '_Not provided._'),
    section('Supporting notes', data.notes.trim() || '_None._'),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

export function buildStandupMarkdown(title: string, data: StandupData): string {
  return [
    `# ${title.trim() || `Daily standup — ${data.date}`}`,
    '',
    `**Date:** ${data.date || 'Not set'}`,
    '',
    section('Yesterday', bullets(data.yesterday)),
    section('Today', bullets(data.today)),
    section('Blockers and dependencies', bullets(data.blockers, '_No blockers._')),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

export function buildReleaseMarkdown(title: string, data: ReleaseData): string {
  const heading = data.version.trim()
    ? `# Release notes — ${data.version.trim()}`
    : `# ${title.trim() || 'Release notes'}`;
  return [
    heading,
    '',
    data.date ? `**Release date:** ${data.date}` : '',
    '',
    section('Features delivered', bullets(data.features)),
    section('Defects fixed', bullets(data.fixes)),
    section('Enhancements', bullets(data.enhancements)),
    section('Known issues', bullets(data.knownIssues)),
    section('Deployment notes', bullets(data.deployment, '_None._')),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

export function buildChecklistMarkdown(title: string, data: ChecklistData): string {
  const sections = data.sections
    .map((section) => {
      const items = section.items
        .map((item) => `- [${item.done ? 'x' : ' '}] ${item.label.trim() || 'Untitled item'}`)
        .join('\n');
      return `## ${section.title.trim() || 'Checklist'}\n\n${items || '_No items._'}\n`;
    })
    .join('\n');
  return `# ${title.trim() || 'Delivery checklist'}\n\n${sections}`.trimEnd().concat('\n');
}

export function buildTestCasesMarkdown(title: string, data: TestCaseSetData): string {
  const cases = data.cases
    .map((testCase, index) => {
      const steps = testCase.steps
        .map((step) => step.trim())
        .filter(Boolean)
        .map((step, stepIndex) => `${stepIndex + 1}. ${step}`)
        .join('\n');
      return [
        `### TC-${String(index + 1).padStart(3, '0')} — ${testCase.scenario.trim() || 'Untitled scenario'}`,
        '',
        `**Type:** ${testCase.type} · **Priority:** ${testCase.priority}`,
        '',
        `**Preconditions:** ${testCase.preconditions.trim() || 'None.'}`,
        '',
        '**Steps:**',
        '',
        steps || '_Not provided._',
        '',
        `**Expected result:** ${testCase.expected.trim() || 'Not provided.'}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    `# Test cases — ${title.trim() || 'Untitled set'}`,
    '',
    '## Requirement under test',
    '',
    data.requirement.trim() || '_Not captured._',
    '',
    '## Cases',
    '',
    cases || '_No test cases yet._',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

function csvCell(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export const TEST_CASE_CSV_HEADERS = [
  'Test ID',
  'Type',
  'Priority',
  'Scenario',
  'Preconditions',
  'Steps',
  'Expected Result',
];

export function testCasesToCsv(cases: TestCase[]): string {
  const rows = cases.map((testCase, index) => [
    `TC-${String(index + 1).padStart(3, '0')}`,
    testCase.type,
    testCase.priority,
    testCase.scenario,
    testCase.preconditions,
    testCase.steps
      .map((step, stepIndex) => `${stepIndex + 1}. ${step}`)
      .join('\n'),
    testCase.expected,
  ]);
  const lines = [
    TEST_CASE_CSV_HEADERS.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ];
  // UTF-8 BOM keeps Excel happy with non-ASCII characters.
  return `\uFEFF${lines.join('\r\n')}`;
}
