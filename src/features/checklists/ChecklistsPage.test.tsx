import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChecklistsPage } from './ChecklistsPage';
import { ToastProvider } from '../../components/Toast';
import { resetWorkspaceForTests, useWorkspace } from '../../lib/store';
import type { ChecklistData } from '../../lib/types';

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ChecklistsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

function savedChecklist(): ChecklistData {
  const item = useWorkspace.getState().items[0];
  return item.data as ChecklistData;
}

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspaceForTests();
});

describe('ChecklistsPage', () => {
  it('renders the default gates and a full set of checkboxes', () => {
    renderPage();
    expect(screen.getByDisplayValue('Code review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Security')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Release readiness')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(20);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('saves a titled checklist with ticked progress', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/checklist title/i), 'Release 1.0');
    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getByRole('button', { name: /save checklist/i }));

    const items = useWorkspace.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Release 1.0');
    expect(savedChecklist().sections[0].items[0].done).toBe(true);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).not.toBe('0');
  });

  it('auto-saves further ticks after the first save', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/checklist title/i), 'Sprint 24');
    await user.click(screen.getByRole('button', { name: /save checklist/i }));
    expect(savedChecklist().sections[0].items[1].done).toBe(false);

    await user.click(screen.getAllByRole('checkbox')[1]);

    expect(savedChecklist().sections[0].items[1].done).toBe(true);
    expect(screen.getByText('Ticks save automatically.')).toBeInTheDocument();
  });

  it('adds a custom section and a custom item', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /^add section$/i }));
    expect(screen.getByDisplayValue('New section')).toBeInTheDocument();

    const addItemButtons = screen.getAllByRole('button', { name: /^add item$/i });
    await user.click(addItemButtons[addItemButtons.length - 1]);
    expect(screen.getAllByLabelText('Checklist item')).toHaveLength(
      screen.getAllByRole('checkbox').length,
    );
  });

  it('requires a title before the first save', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /save checklist/i }));
    expect(useWorkspace.getState().items).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent(/title before saving/i);
  });
});
