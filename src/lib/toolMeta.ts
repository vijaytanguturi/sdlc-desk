import type { LucideIcon } from 'lucide-react';
import {
  Bug,
  FileText,
  FlaskConical,
  ListChecks,
  MessageSquareText,
  Rocket,
} from 'lucide-react';
import type { ToolId } from './types';

export interface ToolMeta {
  id: ToolId;
  path: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
}

export const TOOL_META: Record<ToolId, ToolMeta> = {
  requirement: {
    id: 'requirement',
    path: '/requirements',
    name: 'Requirement Builder',
    shortName: 'Requirements',
    description: 'Turn rough notes into a structured requirement with acceptance criteria.',
    icon: FileText,
  },
  testcase: {
    id: 'testcase',
    path: '/test-cases',
    name: 'Test Case Generator',
    shortName: 'Test cases',
    description: 'Draft positive, negative, boundary and edge cases, then tailor and export them.',
    icon: FlaskConical,
  },
  bug: {
    id: 'bug',
    path: '/bugs',
    name: 'Bug Report Builder',
    shortName: 'Defects',
    description: 'Capture a reproducible defect with clean steps, expected and actual results.',
    icon: Bug,
  },
  standup: {
    id: 'standup',
    path: '/standup',
    name: 'Daily Standup',
    shortName: 'Standup',
    description: 'Record progress, plans and blockers, then copy a concise update.',
    icon: MessageSquareText,
  },
  release: {
    id: 'release',
    path: '/release-notes',
    name: 'Release Notes',
    shortName: 'Releases',
    description: 'Assemble features, fixes, known issues and deployment notes into one document.',
    icon: Rocket,
  },
  checklist: {
    id: 'checklist',
    path: '/checklists',
    name: 'Delivery Checklist',
    shortName: 'Checklists',
    description: 'Work through configurable review, security, deployment and release gates.',
    icon: ListChecks,
  },
};

export const TOOL_LIST = Object.values(TOOL_META);
