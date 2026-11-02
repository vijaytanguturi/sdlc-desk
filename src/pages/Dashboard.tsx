import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bug,
  FileText,
  FlaskConical,
  ListChecks,
  MessageSquareText,
  Plus,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../lib/store';
import { TOOL_LIST, TOOL_META } from '../lib/toolMeta';
import { checklistProgress } from '../lib/defaults';
import { formatDate, relativeTime } from '../lib/id';
import type { ChecklistData, StandupData, TestCaseSetData } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { Card, CardBody, CardHead } from '../components/Card';
import { Badge } from '../components/Badge';

function countTestCases(items: ReturnType<typeof useWorkspace.getState>['items']): number {
  return items
    .filter((item) => item.tool === 'testcase')
    .reduce((total, item) => {
      const data = item.data as TestCaseSetData;
      return total + (Array.isArray(data.cases) ? data.cases.length : 0);
    }, 0);
}

export function Dashboard() {
  const items = useWorkspace((state) => state.items);

  const requirements = items.filter((item) => item.tool === 'requirement');
  const defects = items.filter((item) => item.tool === 'bug');
  const releases = items.filter((item) => item.tool === 'release');
  const testCaseCount = countTestCases(items);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const standupsThisWeek = items.filter((item) => {
    if (item.tool !== 'standup') return false;
    const date = new Date((item.data as StandupData).date);
    return !Number.isNaN(date.getTime()) && date.getTime() >= weekAgo;
  });

  const progress = items
    .filter((item) => item.tool === 'checklist')
    .reduce(
      (total, item) => {
        const result = checklistProgress(item.data as ChecklistData);
        return { done: total.done + result.done, total: total.total + result.total };
      },
      { done: 0, total: 0 },
    );
  const progressPercent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const stats = [
    { label: 'Requirements', value: requirements.length, icon: FileText, to: '/requirements' },
    { label: 'Test cases', value: testCaseCount, icon: FlaskConical, to: '/test-cases' },
    { label: 'Defect reports', value: defects.length, icon: Bug, to: '/bugs' },
    { label: 'Standups this week', value: standupsThisWeek.length, icon: MessageSquareText, to: '/standup' },
    { label: 'Release notes', value: releases.length, icon: Rocket, to: '/release-notes' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Daily workbench"
        title="Your SDLC workspace"
        description="Draft requirements, test cases, defects, standups, release notes and delivery checks — all in one place, all on this device."
        actions={
          <Link className="btn btn--primary" to="/requirements">
            <Plus size={16} aria-hidden="true" />
            Start a requirement
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="welcome-banner">
          <div className="welcome-banner__icon" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="welcome-banner__title">Nothing saved yet — pick a tool and start</h2>
            <p className="welcome-banner__text">
              Every item you save stays in this browser. No sign-up, no server, no data leaving your
              machine. Use <strong>Settings → Export</strong> whenever you want a backup.
            </p>
          </div>
        </div>
      ) : null}

      <section className="stat-grid" aria-label="Workspace summary">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link className="stat" to={stat.to} key={stat.label}>
              <span className="stat__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="stat__value">{stat.value}</span>
              <span className="stat__label">{stat.label}</span>
            </Link>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <Card>
          <CardHead
            title="Quick actions"
            description="Every tool follows the same pattern: capture, preview, save, export."
          />
          <CardBody>
            <div className="quick-grid">
              {TOOL_LIST.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link className="quick-card" to={tool.path} key={tool.id}>
                    <span className="quick-card__icon" aria-hidden="true">
                      <Icon size={19} />
                    </span>
                    <span className="quick-card__text">
                      <span className="quick-card__title">{tool.name}</span>
                      <span className="quick-card__desc">{tool.description}</span>
                    </span>
                    <ArrowRight size={16} className="quick-card__arrow" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div className="dashboard-side">
          <Card>
            <CardHead title="Checklist progress" description="Across every saved checklist." />
            <CardBody>
              <div className="progress">
                <div className="progress__meta">
                  <span>
                    {progress.done} of {progress.total} items complete
                  </span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div
                  className="progress__track"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Checklist completion"
                >
                  <div className="progress__bar" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <Link className="btn btn--ghost btn--sm" to="/checklists">
                <ListChecks size={15} aria-hidden="true" />
                Open checklists
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Recent work"
              description="Your five most recently updated items."
              actions={
                items.length > 0 ? (
                  <Link className="btn btn--subtle btn--sm" to="/library">
                    Library
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {recent.length === 0 ? (
                <p className="muted">Save an item and it will show up here.</p>
              ) : (
                <ul className="recent">
                  {recent.map((item) => (
                    <li key={item.id}>
                      <Link className="recent__link" to={`${TOOL_META[item.tool].path}?item=${item.id}`}>
                        <span className="recent__main">
                          <span className="recent__title">{item.title}</span>
                          <span className="recent__meta">
                            {TOOL_META[item.tool].shortName} · {relativeTime(item.updatedAt)}
                          </span>
                        </span>
                        <Badge tone="neutral">{formatDate(item.updatedAt)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead
          title="Built for delivery teams"
          description="A consistent workflow for engineers, testers, analysts, scrum masters and leads."
        />
        <CardBody>
          <div className="value-grid">
            <div className="value">
              <h3>No account, no server</h3>
              <p>All data is stored locally. Nothing is transmitted, so it works offline after loading.</p>
            </div>
            <div className="value">
              <h3>Exports that fit your process</h3>
              <p>Markdown for tickets and wikis, CSV for test management tools, copy-ready standup text.</p>
            </div>
            <div className="value">
              <h3>Ready for what comes next</h3>
              <p>Generators and storage sit behind interfaces, so AI or team sync can be added later.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
