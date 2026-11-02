import { createId } from './id';
import type { ChecklistData, ChecklistSection } from './types';

interface SectionSeed {
  title: string;
  items: string[];
}

const SEED: SectionSeed[] = [
  {
    title: 'Code review',
    items: [
      'Pull request description explains the change and links the ticket',
      'Diff is focused and free of unrelated refactoring',
      'Naming, structure and readability reviewed',
      'No debug code, commented-out blocks or hardcoded secrets',
      'Unit tests added or updated for changed logic',
      'Documentation and configuration examples updated',
    ],
  },
  {
    title: 'Testing',
    items: [
      'Unit tests pass locally and in CI',
      'Integration or end-to-end coverage added for the changed flow',
      'Regression scope identified and executed',
      'Test evidence attached to the ticket or pull request',
      'Cross-browser and mobile layout checked',
      'Accessibility basics verified (labels, focus order, contrast)',
    ],
  },
  {
    title: 'Security',
    items: [
      'Input validation and output encoding reviewed',
      'Authorization checked for every new action and endpoint',
      'No secrets, tokens or personal data committed',
      'Dependency and container scan reviewed',
      'Sensitive values excluded from logs and error messages',
      'Relevant OWASP risks considered for this change',
    ],
  },
  {
    title: 'Deployment',
    items: [
      'Release notes prepared',
      'Database migration and rollback plan documented',
      'Feature flags or configuration switches verified',
      'Environment variables and secrets configured in the target environment',
      'Monitoring, alerts and dashboards updated',
      'Backup verified before destructive changes',
    ],
  },
  {
    title: 'Release readiness',
    items: [
      'Stakeholder and product sign-off recorded',
      'Support and on-call teams briefed',
      'Go / no-go decision documented',
      'Post-deployment verification steps assigned',
      'Communication sent to affected users',
      'Known issues documented with owners',
    ],
  },
];

export function createDefaultChecklist(): ChecklistData {
  const sections: ChecklistSection[] = SEED.map((section) => ({
    id: createId(),
    title: section.title,
    items: section.items.map((label) => ({
      id: createId(),
      label,
      done: false,
    })),
  }));
  return { sections };
}

export function checklistProgress(data: ChecklistData): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const section of data.sections) {
    for (const item of section.items) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { done, total };
}
