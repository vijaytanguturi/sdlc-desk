import { describe, expect, it } from 'vitest';
import { generateTestCases, ruleBasedGenerator } from './generator';
import type { TestType } from './types';

describe('rule-based test case generator', () => {
  it('produces a review-ready starter set with every test type', () => {
    const cases = generateTestCases(
      'As a finance approver, I want to approve up to 50 expense claims in one action.',
    );
    expect(cases.length).toBeGreaterThanOrEqual(7);
    const types = new Set<TestType>(cases.map((testCase) => testCase.type));
    expect(types).toEqual(new Set(['Positive', 'Negative', 'Boundary', 'Edge']));
    for (const testCase of cases) {
      expect(testCase.scenario.length).toBeGreaterThan(0);
      expect(testCase.expected.length).toBeGreaterThan(0);
      expect(testCase.steps.length).toBeGreaterThan(0);
      expect(testCase.id).toBeTruthy();
    }
  });

  it('never produces duplicate scenarios', () => {
    const cases = generateTestCases('User can search, filter and export a report');
    const scenarios = cases.map((testCase) => testCase.scenario);
    expect(new Set(scenarios).size).toBe(scenarios.length);
  });

  it('adds authentication-specific coverage when the story mentions login', () => {
    const cases = generateTestCases('A user can log in with their corporate password.');
    const scenarios = cases.map((testCase) => testCase.scenario.toLowerCase());
    expect(scenarios.some((scenario) => scenario.includes('permission'))).toBe(true);
  });

  it('adds export and upload coverage from keywords', () => {
    const cases = generateTestCases('An analyst can export a CSV and upload supporting documents.');
    const scenarios = cases.map((testCase) => testCase.scenario.toLowerCase());
    expect(scenarios.some((scenario) => scenario.includes('exported output'))).toBe(true);
    expect(scenarios.some((scenario) => scenario.includes('oversized files'))).toBe(true);
  });

  it('caps the output at 12 cases even with many keywords', () => {
    const cases = generateTestCases(
      'Login, search, upload, export, payment, delete, email and API integration for the admin role.',
    );
    expect(cases.length).toBeLessThanOrEqual(12);
  });

  it('still returns generic coverage for an empty requirement', () => {
    const cases = generateTestCases('   ');
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].scenario).toContain('the feature');
  });

  it('is deterministic apart from generated ids', () => {
    const input = 'Users can reset a forgotten password.';
    const first = generateTestCases(input).map(({ id: _id, ...rest }) => rest);
    const second = generateTestCases(input).map(({ id: _id, ...rest }) => rest);
    expect(first).toEqual(second);
    expect(ruleBasedGenerator.generate(input)).toHaveLength(first.length);
  });
});
