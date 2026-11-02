import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function createRequirement(page: Page, title = 'Bulk approve expense claims') {
  await page.goto('/#/requirements');
  await page.getByLabel('Requirement title').fill(title);
  await page.getByRole('button', { name: 'Save requirement' }).click();
  await expect(page.getByText('Requirement saved locally.')).toBeVisible();
}

test('loads the dashboard and navigates to a tool', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your SDLC workspace' })).toBeVisible();
  await expect(page.getByText('Nothing saved yet — pick a tool and start')).toBeVisible();

  if (testInfo.project.name === 'mobile-chrome') {
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page
      .getByRole('dialog', { name: 'Navigation' })
      .getByRole('link', { name: 'Requirements' })
      .click();
  } else {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Requirements' })
      .click();
  }

  await expect(page.getByRole('heading', { name: /shape rough notes/i })).toBeVisible();
});

test('requirement: capture, preview, export, persist and search', async ({ page }) => {
  await page.goto('/#/requirements');
  await page.getByLabel('Requirement title').fill('Bulk approve expense claims');
  await page.getByLabel('Business objective').fill('Close the month-end backlog faster.');
  await page.getByRole('button', { name: 'Add acceptance criterion' }).click();
  await page
    .getByRole('textbox', { name: /acceptance criteria item 1/i })
    .fill('All 50 claims move to Approved.');
  await page.getByRole('button', { name: 'Save requirement' }).click();

  await expect(page.getByText('Requirement saved locally.')).toBeVisible();
  const preview = page.getByLabel('Document preview');
  await expect(preview).toContainText('# Bulk approve expense claims');
  await expect(preview).toContainText('- [ ] All 50 claims move to Approved.');
  await expect(preview).toContainText('Close the month-end backlog faster.');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bulk-approve-expense-claims.md');

  await page.reload();
  await expect(page.getByText('Bulk approve expense claims', { exact: true })).toBeVisible();

  await page.goto('/#/library');
  await page.getByLabel('Search saved work').fill('month-end');
  await expect(page.getByText('Bulk approve expense claims', { exact: true })).toBeVisible();
  await expect(page.getByText('1 item')).toBeVisible();
});

test('test cases: generate, edit, delete, save, reopen and export CSV', async ({ page }) => {
  await page.goto('/#/test-cases');
  await page.getByLabel('Set title').fill('Bulk approval regression');
  await page
    .getByLabel('Requirement or user story')
    .fill('As a finance approver I want to log in and export a CSV report of claims.');
  await page.getByRole('button', { name: 'Generate starter cases' }).click();
  await expect(page.getByText(/starter cases added/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Test cases \(\d+\)/ })).toBeVisible();

  await page.getByLabel('Scenario').first().fill('Verify the primary success path for bulk approval');

  await page.getByRole('button', { name: 'Save test set' }).click();
  await expect(page.getByText('Test case set saved locally.')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bulk-approval-regression.csv');

  await page.reload();
  await expect(page.getByText('Bulk approval regression', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open Bulk approval regression' }).click();
  await expect(page.getByLabel('Set title')).toHaveValue('Bulk approval regression');
  await expect(page.getByLabel('Scenario').first()).toHaveValue(
    'Verify the primary success path for bulk approval',
  );

  const headingBefore = await page.getByRole('heading', { name: /Test cases \(\d+\)/ }).textContent();
  await page.getByRole('button', { name: 'Delete test case 2', exact: true }).click();
  const headingAfter = await page.getByRole('heading', { name: /Test cases \(\d+\)/ }).textContent();
  expect(headingAfter).not.toBe(headingBefore);
});

test('defect: capture, copy to clipboard and export', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4173',
    });
  }
  await page.goto('/#/bugs');
  await page.getByLabel('Defect title').fill('Bulk approval times out');
  await page.getByLabel('Environment').fill('Release 2.4.0 · Chrome 141 · staging');
  await page.getByRole('button', { name: 'Add step' }).click();
  await page
    .getByRole('textbox', { name: /steps to reproduce item 1/i })
    .fill('Select 50 pending claims and choose Approve.');
  await page.getByLabel('Actual result').fill('The request fails after 30 seconds.');
  await page.getByLabel('Expected result').fill('All 50 claims are approved within 5 seconds.');
  await page.getByRole('button', { name: 'Save defect' }).click();
  await expect(page.getByText('Defect report saved locally.')).toBeVisible();

  const preview = page.getByLabel('Document preview');
  await expect(preview).toContainText('# Defect: Bulk approval times out');
  await expect(preview).toContainText('| Severity | Major |');
  await expect(preview).toContainText('1. Select 50 pending claims and choose Approve.');

  if (browserName === 'chromium') {
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByText('Copied to clipboard.')).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('# Defect: Bulk approval times out');
  }

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bulk-approval-times-out.md');
});

test('standup: save, carry forward the plan and export', async ({ page }) => {
  await page.goto('/#/standup');
  await page.getByRole('button', { name: 'Add accomplishment' }).click();
  await page
    .getByRole('textbox', { name: /accomplishments item 1/i })
    .fill('Finished bulk-approval API and regression tests.');
  await page.getByRole('button', { name: 'Add plan item' }).click();
  await page
    .getByRole('textbox', { name: /plan item 1/i })
    .fill('Pair with QA on the approval audit trail.');
  await page.getByRole('button', { name: 'Add blocker' }).click();
  await page
    .getByRole('textbox', { name: /blockers and dependencies item 1/i })
    .fill('Waiting on staging database access (Priya).');
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('Standup entry saved locally.')).toBeVisible();
  await expect(page.getByLabel('Document preview')).toContainText(
    '- Finished bulk-approval API and regression tests.',
  );

  await page.getByRole('button', { name: 'New entry' }).click();
  await page.getByRole('button', { name: 'Carry forward last plan' }).click();
  await expect(page.getByRole('textbox', { name: /accomplishments item 1/i })).toHaveValue(
    'Pair with QA on the approval audit trail.',
  );

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/standup.*\.md$/);
});

test('release notes: assemble sections and export', async ({ page }) => {
  await page.goto('/#/release-notes');
  await page.getByLabel('Release title').fill('Spring release');
  await page.getByLabel('Version').fill('2.4.0');
  await page.getByRole('button', { name: 'Add feature' }).click();
  await page
    .getByRole('textbox', { name: /features delivered item 1/i })
    .fill('Approvers can clear up to 50 claims in one action.');
  await page.getByRole('button', { name: 'Add fix' }).click();
  await page
    .getByRole('textbox', { name: /defects fixed item 1/i })
    .fill('Bulk approval no longer times out.');
  await page.getByRole('button', { name: 'Save release' }).click();
  await expect(page.getByText('Release notes saved locally.')).toBeVisible();

  const preview = page.getByLabel('Document preview');
  await expect(preview).toContainText('# Release notes — 2.4.0');
  await expect(preview).toContainText('## Features delivered');
  await expect(preview).toContainText('- Bulk approval no longer times out.');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('2-4-0.md');
});

test('checklist: tick, save, reopen and auto-save progress', async ({ page }) => {
  await page.goto('/#/checklists');
  await page.getByLabel('Checklist title').fill('Release 1.0');
  const checkboxes = page.getByRole('checkbox');
  await checkboxes.first().check();
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByText(/Checklist saved/i)).toBeVisible();

  const progressValue = Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'));
  expect(progressValue).toBeGreaterThan(0);

  await page.reload();
  await page.getByRole('button', { name: 'Open Release 1.0' }).click();
  await expect(page.getByLabel('Checklist title')).toHaveValue('Release 1.0');
  await expect(page.getByRole('checkbox').first()).toBeChecked();

  await page.getByRole('checkbox').nth(1).check();
  await page.reload();
  await page.getByRole('button', { name: 'Open Release 1.0' }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByRole('checkbox').nth(1)).toBeChecked();
});

test('settings: export a backup, clear, then restore it', async ({ page }, testInfo) => {
  await createRequirement(page, 'Backup round trip');
  await page.goto('/#/settings');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup (JSON)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sdlc-desk-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = testInfo.outputPath('backup.json');
  await download.saveAs(backupPath);

  await page.getByRole('button', { name: 'Clear all data' }).click();
  await page.getByRole('button', { name: 'Clear everything' }).click();
  await expect(page.getByText('All saved items were cleared.')).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.getByText(/Imported 1 saved item/)).toBeVisible();
  await expect(page.locator('.data-stats__value').first()).toHaveText('1');
});

test('theme preference persists across reloads', async ({ page }) => {
  await page.goto('/#/settings');
  await page.locator('button[title="Dark theme"]:visible').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('button[title="Light theme"]:visible').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('unknown routes show a useful not-found page', async ({ page }) => {
  await page.goto('/#/does-not-exist');
  await expect(page.getByRole('heading', { name: 'That page does not exist' })).toBeVisible();
});

test('workspace switches between sidebar and drawer layouts', async ({ page }, testInfo) => {
  await page.goto('/#/requirements');
  const main = await page.locator('.tool-grid__main').boundingBox();
  const aside = await page.locator('.tool-grid__aside').boundingBox();
  expect(main).not.toBeNull();
  expect(aside).not.toBeNull();

  if (testInfo.project.name === 'mobile-chrome') {
    await expect(page.locator('aside.sidebar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    expect(aside!.y).toBeGreaterThan(main!.y);
  } else {
    await expect(page.locator('aside.sidebar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
    expect(aside!.x).toBeGreaterThan(main!.x + main!.width - 1);
    expect(Math.abs(aside!.y - main!.y)).toBeLessThan(8);
  }
});

test('layouts do not overflow horizontally', async ({ page }) => {
  for (const path of ['/', '/#/requirements', '/#/checklists', '/#/library']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
