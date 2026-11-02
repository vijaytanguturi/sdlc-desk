export type ToolId =
  | 'requirement'
  | 'testcase'
  | 'bug'
  | 'standup'
  | 'release'
  | 'checklist';

export type ThemePreference = 'light' | 'dark' | 'system';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type Severity = 'Minor' | 'Major' | 'Critical' | 'Blocker';

export type TestType = 'Positive' | 'Negative' | 'Boundary' | 'Edge';

export interface Settings {
  theme: ThemePreference;
}

export interface RequirementData {
  objective: string;
  functional: string[];
  assumptions: string[];
  dependencies: string[];
  acceptance: string[];
  priority: Priority;
}

export interface TestCase {
  id: string;
  scenario: string;
  type: TestType;
  priority: Priority;
  preconditions: string;
  steps: string[];
  expected: string;
}

export interface TestCaseSetData {
  requirement: string;
  cases: TestCase[];
}

export interface BugData {
  environment: string;
  severity: Severity;
  priority: Priority;
  steps: string[];
  actual: string;
  expected: string;
  notes: string;
}

export interface StandupData {
  date: string;
  yesterday: string[];
  today: string[];
  blockers: string[];
}

export interface ReleaseData {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
  enhancements: string[];
  knownIssues: string[];
  deployment: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistData {
  sections: ChecklistSection[];
}

export interface ToolDataMap {
  requirement: RequirementData;
  testcase: TestCaseSetData;
  bug: BugData;
  standup: StandupData;
  release: ReleaseData;
  checklist: ChecklistData;
}

export interface WorkItem<T = unknown> {
  id: string;
  tool: ToolId;
  title: string;
  createdAt: string;
  updatedAt: string;
  data: T;
}

export type WorkspaceItem = {
  [K in ToolId]: WorkItem<ToolDataMap[K]> & { tool: K };
}[ToolId];

export const TOOL_IDS: ToolId[] = [
  'requirement',
  'testcase',
  'bug',
  'standup',
  'release',
  'checklist',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
export const SEVERITIES: Severity[] = ['Minor', 'Major', 'Critical', 'Blocker'];
export const TEST_TYPES: TestType[] = ['Positive', 'Negative', 'Boundary', 'Edge'];
