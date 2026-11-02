import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RequirementsPage } from './RequirementsPage';
import { ToastProvider } from '../../components/Toast';
import { resetWorkspaceForTests, useWorkspace } from '../../lib/store';
import { WORKSPACE_KEY } from '../../lib/storage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <RequirementsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspaceForTests();
});

describe('RequirementsPage', () => {
  it('saves a requirement, shows it in the list and persists it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/requirement title/i), 'Bulk approve expense claims');
    await user.type(screen.getByLabelText(/business objective/i), 'Close month-end faster.');
    await user.click(screen.getByRole('button', { name: /save requirement/i }));

    expect(useWorkspace.getState().items).toHaveLength(1);
    expect(screen.getByLabelText('Document preview')).toHaveTextContent(
      '# Bulk approve expense claims',
    );
    expect(screen.getByLabelText('Document preview')).toHaveTextContent('Close month-end faster.');
    expect(window.localStorage.getItem(WORKSPACE_KEY)).toContain('Bulk approve expense claims');
  });

  it('blocks saving without a title and explains why', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /save requirement/i }));

    expect(useWorkspace.getState().items).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent(/title before saving/i);
  });

  it('adds and removes acceptance criteria through the list editor', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /add acceptance criterion/i }));
    const field = screen.getByRole('textbox', { name: /acceptance criteria item 1/i });
    await user.type(field, 'All 50 claims are approved');
    expect(field).toHaveValue('All 50 claims are approved');

    await user.click(screen.getByRole('button', { name: /remove acceptance criteria item 1/i }));
    expect(
      screen.queryByRole('textbox', { name: /acceptance criteria item 1/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the saved requirement after saving and allows editing it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/requirement title/i), 'First title');
    await user.click(screen.getByRole('button', { name: /save requirement/i }));
    await user.clear(screen.getByLabelText(/requirement title/i));
    await user.type(screen.getByLabelText(/requirement title/i), 'Updated title');
    await user.click(screen.getByRole('button', { name: /update requirement/i }));

    const saved = useWorkspace.getState().items;
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('Updated title');
  });

  it('opens the delete confirmation and deletes on request', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/requirement title/i), 'Disposable');
    await user.click(screen.getByRole('button', { name: /save requirement/i }));
    await user.click(screen.getByRole('button', { name: /delete disposable/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /delete permanently/i }));

    expect(useWorkspace.getState().items).toHaveLength(0);
  });
});
