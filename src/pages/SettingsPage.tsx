import { useRef, useState } from 'react';
import { Download, FileUp, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card, CardBody, CardHead } from '../components/Card';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { Modal } from '../components/Modal';
import { useToast } from '../components/toastContext';
import { useWorkspace } from '../lib/store';
import { serializeWorkspace } from '../lib/storage';
import { downloadText } from '../lib/io';
import { todayIsoDate } from '../lib/id';

export function SettingsPage() {
  const items = useWorkspace((state) => state.items);
  const settings = useWorkspace((state) => state.settings);
  const importWorkspace = useWorkspace((state) => state.importWorkspace);
  const clearAll = useWorkspace((state) => state.clearAll);
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const serialized = serializeWorkspace({ items, settings });
  const sizeKb = Math.max(1, Math.round(new Blob([serialized]).size / 1024));

  const handleExport = () => {
    downloadText(
      `sdlc-desk-backup-${todayIsoDate()}.json`,
      serialized,
      'application/json;charset=utf-8',
    );
    notify('Workspace backup downloaded.');
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify('That file is larger than 5 MB. Choose a smaller backup file.', 'error');
      return;
    }
    try {
      const text = await file.text();
      const result = importWorkspace(text);
      if (result.ok) {
        notify(`Imported ${result.count} saved ${result.count === 1 ? 'item' : 'items'}.`);
      } else {
        notify(result.error ?? 'That file could not be imported.', 'error');
      }
    } catch {
      notify('The file could not be read.', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Preferences and data"
        description="Control appearance, back up your workspace and review how this application handles your information."
      />

      <div className="settings-grid">
        <Card>
          <CardHead
            title="Appearance"
            description="Choose a theme or follow your operating system. The choice is saved locally."
          />
          <CardBody>
            <div className="setting-row">
              <div>
                <p className="setting-row__title">Colour theme</p>
                <p className="setting-row__hint">Light, dark, or match the system setting.</p>
              </div>
              <ThemeToggle showLabels />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead
            title="Workspace data"
            description="Everything is stored in this browser's local storage under one versioned document."
          />
          <CardBody>
            <div className="data-stats">
              <div>
                <span className="data-stats__value">{items.length}</span>
                <span className="data-stats__label">saved items</span>
              </div>
              <div>
                <span className="data-stats__value">{sizeKb} KB</span>
                <span className="data-stats__label">approximate size</span>
              </div>
              <div>
                <span className="data-stats__value">Local</span>
                <span className="data-stats__label">storage only</span>
              </div>
            </div>

            <div className="setting-actions">
              <Button icon={<Download size={15} />} onClick={handleExport}>
                Export backup (JSON)
              </Button>
              <Button icon={<FileUp size={15} />} onClick={() => fileRef.current?.click()}>
                Import backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Choose a workspace backup file"
                onChange={(event) => void handleImport(event.target.files?.[0])}
              />
              <Button
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => setClearOpen(true)}
                disabled={items.length === 0}
              >
                Clear all data
              </Button>
            </div>

            <p className="muted small">
              Importing replaces the current workspace with the contents of the backup file. Export
              first if you are unsure.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Privacy and acceptable use"
          description="This tool is designed for corporate environments, so the default is to keep everything local."
        />
        <CardBody>
          <ul className="privacy-list">
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>Local only.</strong> Work items, preferences and checklist progress are stored
                in your browser's local storage. There is no account, backend database or cloud sync.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>No transmission, no analytics.</strong> The application makes no network
                requests after it loads, includes no trackers and calls no third-party AI service.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>Follow your organisation's policy.</strong> Do not store customer data,
                personal data, credentials, production secrets or confidential material unless your
                employer's data-handling rules allow it on this device.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>Not a certified system.</strong> SDLC Desk is a productivity aid. It is not
                certified against ISO 27001, SOC 2 or any other standard, and it is not a system of
                record.
              </span>
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>Shared devices.</strong> Anyone with access to this browser profile can read or
                export the data. Clear it from this page when you finish on a shared machine.
              </span>
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHead title="About" description="Version and technology." />
        <CardBody>
          <dl className="about-list">
            <div>
              <dt>Version</dt>
              <dd>1.0.0</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>React, TypeScript, Vite</dd>
            </div>
            <div>
              <dt>License</dt>
              <dd>MIT</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                <a href="https://github.com/vijaytanguturi/sdlc-desk" target="_blank" rel="noreferrer">
                  github.com/vijaytanguturi/sdlc-desk
                </a>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Modal
        open={clearOpen}
        title="Clear all saved data?"
        onClose={() => setClearOpen(false)}
        footer={
          <>
            <Button onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAll();
                setClearOpen(false);
                notify('All saved items were cleared.', 'info');
              }}
            >
              Clear everything
            </Button>
          </>
        }
      >
        <p>
          This removes all {items.length} saved items from this browser. Appearance preferences are
          kept. This cannot be undone — export a backup first if you need one.
        </p>
      </Modal>
    </>
  );
}
