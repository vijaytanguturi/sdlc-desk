import { describe, expect, it } from 'vitest';
import {
  buildBugMarkdown,
  buildChecklistMarkdown,
  buildReleaseMarkdown,
  buildRequirementMarkdown,
  buildStandupMarkdown,
  buildTestCasesMarkdown,
  testCasesToCsv,
} from './exporters';
import type {
  BugData,
  ChecklistData,
  ReleaseData,
  RequirementData,
  StandupData,
  TestCase,
} from './types';

const requirement: RequirementData = {
  objective: 'Close the month-end backlog faster.',
  functional: ['Approver selects up to 50 claims.', 'System approves in one action.'],
  assumptions: ['Claims are already validated.'],
  dependencies: ['Approval service API v2.'],
  acceptance: ['All 50 claims move to Approved.', 'One audit entry is written.'],
  priority: 'High',
};

describe('buildRequirementMarkdown', () => {
  it('renders every structured section', () => {
    const markdown = buildRequirementMarkdown('Bulk approve claims', requirement);
    expect(markdown).toContain('# Bulk approve claims');
    expect(markdown).toContain('**Priority:** High');
    expect(markdown).toContain('## Business objective');
    expect(markdown).toContain('## Functional requirements');
    expect(markdown).toContain('1. Approver selects up to 50 claims.');
    expect(markdown).toContain('- Claims are already validated.');
    expect(markdown).toContain('- Approval service API v2.');
    expect(markdown).toContain('- [ ] All 50 claims move to Approved.');
  });

  it('uses readable fallbacks for empty sections', () => {
    const markdown = buildRequirementMarkdown('Empty requirement', {
      objective: '',
      functional: [],
      assumptions: [],
      dependencies: [],
      acceptance: [],
      priority: 'Low',
    });
    expect(markdown).toContain('_Not captured._');
    expect(markdown).toContain('_None._');
    expect(markdown).toContain('_None captured._');
  });
});

describe('buildBugMarkdown', () => {
  it('renders a defect with numbered reproduction steps', () => {
    const bug: BugData = {
      environment: 'Chrome 141 / staging',
      severity: 'Critical',
      priority: 'High',
      steps: ['Select 50 claims.', 'Click approve.'],
      actual: 'Request fails after 30 seconds.',
      expected: 'Claims are approved.',
      notes: 'API returns 504.',
    };
    const markdown = buildBugMarkdown('Bulk approval times out', bug);
    expect(markdown).toContain('# Defect: Bulk approval times out');
    expect(markdown).toContain('| Severity | Critical |');
    expect(markdown).toContain('| Environment | Chrome 141 / staging |');
    expect(markdown).toContain('1. Select 50 claims.');
    expect(markdown).toContain('2. Click approve.');
    expect(markdown).toContain('Request fails after 30 seconds.');
  });
});

describe('buildStandupMarkdown', () => {
  it('renders progress, plan and blockers', () => {
    const standup: StandupData = {
      date: '2026-11-02',
      yesterday: ['Finished API'],
      today: ['Pair with QA'],
      blockers: ['Waiting on staging access'],
    };
    const markdown = buildStandupMarkdown('', standup);
    expect(markdown).toContain('# Daily standup — 2026-11-02');
    expect(markdown).toContain('- Finished API');
    expect(markdown).toContain('- Pair with QA');
    expect(markdown).toContain('- Waiting on staging access');
  });

  it('states explicitly when there are no blockers', () => {
    const markdown = buildStandupMarkdown('Standup', {
      date: '2026-11-02',
      yesterday: ['Work'],
      today: ['More work'],
      blockers: [],
    });
    expect(markdown).toContain('_No blockers._');
  });
});

describe('buildReleaseMarkdown', () => {
  it('uses the version in the heading and groups sections', () => {
    const release: ReleaseData = {
      version: '2.4.0',
      date: '2026-11-02',
      features: ['Bulk approval'],
      fixes: ['Timeout fixed'],
      enhancements: ['Better empty state'],
      knownIssues: ['Audit delay'],
      deployment: ['Run migration 0042'],
    };
    const markdown = buildReleaseMarkdown('Spring release', release);
    expect(markdown).toContain('# Release notes — 2.4.0');
    expect(markdown).toContain('**Release date:** 2026-11-02');
    expect(markdown).toContain('## Features delivered');
    expect(markdown).toContain('- Bulk approval');
    expect(markdown).toContain('- Run migration 0042');
  });
});

describe('buildChecklistMarkdown', () => {
  it('marks completed and open items', () => {
    const checklist: ChecklistData = {
      sections: [
        {
          id: 's1',
          title: 'Security',
          items: [
            { id: 'i1', label: 'Secrets removed', done: true },
            { id: 'i2', label: 'Dependencies scanned', done: false },
          ],
        },
      ],
    };
    const markdown = buildChecklistMarkdown('Release 1.0', checklist);
    expect(markdown).toContain('# Release 1.0');
    expect(markdown).toContain('## Security');
    expect(markdown).toContain('- [x] Secrets removed');
    expect(markdown).toContain('- [ ] Dependencies scanned');
  });
});

const testCase: TestCase = {
  id: 'tc1',
  scenario: 'Approve "all" claims',
  type: 'Positive',
  priority: 'High',
  preconditions: 'Approver signed in',
  steps: ['Select claims', 'Click approve, then confirm'],
  expected: 'Claims approved\nAudit entry written',
};

describe('test case exports', () => {
  it('renders a readable markdown outline', () => {
    const markdown = buildTestCasesMarkdown('Bulk approval', {
      requirement: 'As an approver I can bulk approve.',
      cases: [testCase],
    });
    expect(markdown).toContain('# Test cases — Bulk approval');
    expect(markdown).toContain('### TC-001 — Approve "all" claims');
    expect(markdown).toContain('**Type:** Positive · **Priority:** High');
    expect(markdown).toContain('1. Select claims');
  });

  it('produces valid CSV with quoting, BOM and padded IDs', () => {
    const csv = testCasesToCsv([testCase]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Test ID,Type,Priority,Scenario');
    expect(csv).toContain('TC-001');
    expect(csv).toContain('"Approve ""all"" claims"');
    expect(csv).toContain('"1. Select claims');
    expect(csv).toContain('"Claims approved');
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('numbers CSV rows in order', () => {
    const second: TestCase = { ...testCase, id: 'tc2', scenario: 'Second case' };
    const csv = testCasesToCsv([testCase, second]);
    expect(csv).toContain('TC-001');
    expect(csv).toContain('TC-002');
  });
});
