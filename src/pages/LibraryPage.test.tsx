import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from './LibraryPage';
import { ToastProvider } from '../components/Toast';
import { resetWorkspaceForTests, useWorkspace } from '../lib/store';
import type { BugData, RequirementData } from '../lib/types';

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <LibraryPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspaceForTests();
  const { addItem } = useWorkspace.getState();
  addItem('requirement', 'Bulk approve claims', {
    objective: 'Close month-end faster',
    functional: [],
    assumptions: [],
    dependencies: [],
    acceptance: [],
    priority: 'High',
  } satisfies RequirementData);
  addItem('bug', 'Approval timeout on staging', {
    environment: 'Chrome',
    severity: 'Major',
    priority: 'High',
    steps: ['Select 50 claims'],
    actual: 'Timeout',
    expected: 'Approval',
    notes: 'API 504',
  } satisfies BugData);
});

describe('LibraryPage', () => {
  it('lists everything saved', () => {
    renderPage();
    expect(screen.getByText('Bulk approve claims')).toBeInTheDocument();
    expect(screen.getByText('Approval timeout on staging')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('filters by search across titles and content', async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByLabelText(/search saved work/i);
    await user.type(search, '504');
    expect(screen.getByText('Approval timeout on staging')).toBeInTheDocument();
    expect(screen.queryByText('Bulk approve claims')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'month-end');
    expect(screen.getByText('Bulk approve claims')).toBeInTheDocument();
    expect(screen.queryByText('Approval timeout on staging')).not.toBeInTheDocument();
  });

  it('filters by tool chip', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Requirements' }));
    expect(screen.getByText('Bulk approve claims')).toBeInTheDocument();
    expect(screen.queryByText('Approval timeout on staging')).not.toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows a friendly empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/search saved work/i), 'zzzz-no-match');
    expect(screen.getByText('No matching items')).toBeInTheDocument();
  });
});
