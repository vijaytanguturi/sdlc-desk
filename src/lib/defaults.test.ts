import { describe, expect, it } from 'vitest';
import { checklistProgress, createDefaultChecklist } from './defaults';

describe('default checklist', () => {
  it('covers the five delivery gates', () => {
    const checklist = createDefaultChecklist();
    expect(checklist.sections.map((section) => section.title)).toEqual([
      'Code review',
      'Testing',
      'Security',
      'Deployment',
      'Release readiness',
    ]);
    expect(checklist.sections.every((section) => section.items.length >= 5)).toBe(true);
  });

  it('creates fresh ids on every call', () => {
    const first = createDefaultChecklist();
    const second = createDefaultChecklist();
    expect(first.sections[0].id).not.toBe(second.sections[0].id);
    expect(first.sections[0].items[0].id).not.toBe(second.sections[0].items[0].id);
  });

  it('starts with nothing complete and counts progress', () => {
    const checklist = createDefaultChecklist();
    const initial = checklistProgress(checklist);
    expect(initial.done).toBe(0);
    expect(initial.total).toBeGreaterThan(20);

    checklist.sections[0].items[0].done = true;
    checklist.sections[0].items[1].done = true;
    expect(checklistProgress(checklist).done).toBe(2);
  });

  it('handles an empty checklist', () => {
    expect(checklistProgress({ sections: [] })).toEqual({ done: 0, total: 0 });
  });
});
