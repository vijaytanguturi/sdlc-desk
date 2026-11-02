import { createId } from './id';
import type { Priority, TestCase, TestType } from './types';

export interface TestCaseGenerator {
  id: string;
  label: string;
  description: string;
  generate: (input: string) => TestCase[];
}

function summarize(input: string): string {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (!clean) return 'the feature';
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  if (firstSentence.length <= 90) return firstSentence.replace(/[.!?]$/, '');
  const clipped = firstSentence.slice(0, 90);
  return `${clipped.slice(0, clipped.lastIndexOf(' ')) || clipped}…`;
}

interface Draft {
  scenario: string;
  type: TestType;
  priority: Priority;
  preconditions?: string;
  steps: string[];
  expected: string;
}

function makeCase(draft: Draft): TestCase {
  return {
    id: createId(),
    scenario: draft.scenario,
    type: draft.type,
    priority: draft.priority,
    preconditions: draft.preconditions ?? 'User has access to the feature and suitable test data is available.',
    steps: draft.steps,
    expected: draft.expected,
  };
}

const KEYWORD_EXTRAS: Array<{ pattern: RegExp; draft: Draft }> = [
  {
    pattern: /\b(login|log in|sign in|sign-in|password|session|authentication|auth|role|permission)\b/i,
    draft: {
      scenario: 'Verify access is denied for a user without the required permission',
      type: 'Negative',
      priority: 'High',
      preconditions: 'A user account exists without the privilege required for this feature.',
      steps: [
        'Sign in as the restricted user.',
        'Attempt to open or invoke the feature directly.',
        'Check the response, navigation and any server-side action.',
      ],
      expected: 'Access is denied with a clear message, no protected data is shown, and the attempt is not silently ignored.',
    },
  },
  {
    pattern: /\b(search|filter|sort|query)\b/i,
    draft: {
      scenario: 'Verify search and filters behave correctly when no results match',
      type: 'Edge',
      priority: 'Medium',
      steps: [
        'Open the search or filter controls.',
        'Apply a combination that cannot match any record.',
        'Clear the filters and search again.',
      ],
      expected: 'A helpful empty state is shown, filters can be cleared, and the previous result set is restored.',
    },
  },
  {
    pattern: /\b(upload|import|file|attachment|csv|document)\b/i,
    draft: {
      scenario: 'Verify unsupported and oversized files are rejected safely',
      type: 'Negative',
      priority: 'High',
      steps: [
        'Attempt to upload a file with an unsupported extension.',
        'Attempt to upload a file above the documented size limit.',
        'Upload a valid file after the failed attempts.',
      ],
      expected: 'Each invalid file is rejected with a specific message, no partial record is created, and valid uploads still work.',
    },
  },
  {
    pattern: /\b(export|download|report|pdf|csv)\b/i,
    draft: {
      scenario: 'Verify exported output contains all records currently in scope',
      type: 'Positive',
      priority: 'Medium',
      steps: [
        'Apply a known filter or selection.',
        'Trigger the export.',
        'Open the downloaded file and compare it with the on-screen data.',
      ],
      expected: 'The file downloads successfully, matches the on-screen records and opens without formatting errors.',
    },
  },
  {
    pattern: /\b(payment|checkout|order|invoice|price|billing)\b/i,
    draft: {
      scenario: 'Verify a declined payment shows a recoverable error without duplicating the order',
      type: 'Negative',
      priority: 'Critical',
      steps: [
        'Start checkout with a test card that will be declined.',
        'Confirm the payment attempt.',
        'Retry with a valid test card.',
      ],
      expected: 'The decline is explained clearly, the order is not marked as paid, and a valid retry creates exactly one order.',
    },
  },
  {
    pattern: /\b(delete|remove|archive|cancel)\b/i,
    draft: {
      scenario: 'Verify destructive actions require confirmation and can be cancelled',
      type: 'Negative',
      priority: 'High',
      steps: [
        'Select an existing record and choose delete or archive.',
        'Dismiss the confirmation without approving.',
        'Confirm the action on a second attempt.',
      ],
      expected: 'Cancelling leaves the record untouched, confirming performs the action once, and dependent data is handled as documented.',
    },
  },
  {
    pattern: /\b(notification|email|alert|reminder|message)\b/i,
    draft: {
      scenario: 'Verify notification delivery failures are surfaced and can be retried',
      type: 'Edge',
      priority: 'Medium',
      steps: [
        'Trigger the notification with the delivery provider unavailable.',
        'Observe the user-facing status.',
        'Restore the provider and retry.',
      ],
      expected: 'The failure is visible to the user, no duplicate notification is sent, and a retry delivers exactly one message.',
    },
  },
  {
    pattern: /\b(api|integration|webhook|service|sync)\b/i,
    draft: {
      scenario: 'Verify timeout and retry behaviour does not create duplicate records',
      type: 'Edge',
      priority: 'High',
      steps: [
        'Simulate a slow or timed-out downstream response.',
        'Allow the client to retry the request.',
        'Inspect the stored records and downstream system.',
      ],
      expected: 'The timeout is handled gracefully, the retry succeeds, and exactly one record is created.',
    },
  },
];

export function generateTestCases(input: string): TestCase[] {
  const summary = summarize(input);
  const drafts: Draft[] = [
    {
      scenario: `Verify the primary success path for ${summary}`,
      type: 'Positive',
      priority: 'High',
      steps: [
        'Open the feature with a user who has the required access.',
        'Enter valid data in every mandatory field.',
        'Submit and follow the result through to completion.',
      ],
      expected: 'The action succeeds, the result is saved correctly and the user receives clear confirmation.',
    },
    {
      scenario: 'Verify saved data is still correct after leaving and returning to the feature',
      type: 'Positive',
      priority: 'Medium',
      steps: [
        'Complete the primary workflow with known data.',
        'Navigate away or reload the page.',
        'Return to the feature and open the saved record.',
      ],
      expected: 'The saved values are unchanged, formatting is preserved and no duplicate record is created.',
    },
    {
      scenario: 'Verify submission is blocked when mandatory fields are empty',
      type: 'Negative',
      priority: 'High',
      steps: [
        'Open the form and leave all mandatory fields empty.',
        'Attempt to submit.',
        'Complete one required field at a time and submit again.',
      ],
      expected: 'Submission is blocked with field-level messages, focus moves to the first invalid field and no partial record is saved.',
    },
    {
      scenario: 'Verify invalid formats and out-of-range values are rejected',
      type: 'Negative',
      priority: 'High',
      steps: [
        'Enter values in the wrong format (for example malformed dates or invalid characters).',
        'Enter values outside the documented range.',
        'Submit the form.',
      ],
      expected: 'Each invalid value is identified specifically, valid entries are preserved and nothing is saved until corrected.',
    },
    {
      scenario: 'Verify values at the minimum and maximum allowed limits',
      type: 'Boundary',
      priority: 'Medium',
      steps: [
        'Enter the minimum permitted value and submit.',
        'Enter the maximum permitted value and submit.',
        'Enter one unit beyond each limit.',
      ],
      expected: 'Boundary values are accepted, values beyond the limits are rejected, and the messages state the actual limits.',
    },
    {
      scenario: 'Verify behaviour with an empty data set',
      type: 'Edge',
      priority: 'Low',
      steps: [
        'Use an account or workspace with no existing records.',
        'Open the feature and any related lists.',
      ],
      expected: 'A useful empty state is shown with a clear next action and no layout breakage or console errors.',
    },
    {
      scenario: 'Verify special characters, long text and rapid repeated submissions',
      type: 'Edge',
      priority: 'Medium',
      steps: [
        'Enter text containing quotes, angle brackets, emoji and line breaks.',
        'Paste a very long value into a free-text field.',
        'Double-click the submit button quickly.',
      ],
      expected: 'Content is displayed safely without breaking the layout, length limits are enforced and only one record is created.',
    },
  ];

  const lower = input.toLowerCase();
  for (const extra of KEYWORD_EXTRAS) {
    if (extra.pattern.test(lower)) drafts.push(extra.draft);
  }

  const unique = new Map<string, Draft>();
  for (const draft of drafts) {
    if (!unique.has(draft.scenario)) unique.set(draft.scenario, draft);
  }
  return Array.from(unique.values())
    .slice(0, 12)
    .map(makeCase);
}

export const ruleBasedGenerator: TestCaseGenerator = {
  id: 'rule-based-v1',
  label: 'Rule-based starter set',
  description:
    'Builds a review-ready starter set from proven test heuristics. No data leaves this browser and no AI service is called.',
  generate: generateTestCases,
};
