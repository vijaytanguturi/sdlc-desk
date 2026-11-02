import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Layers3,
  LayoutDashboard,
  Library,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { TOOL_LIST } from '../lib/toolMeta';
import { useWorkspace } from '../lib/store';
import { ThemeToggle } from '../components/ThemeToggle';

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavLink to="/" className="brand" onClick={onNavigate}>
      <span className="brand__mark" aria-hidden="true">
        <Layers3 size={19} />
      </span>
      <span className="brand__text">
        <span className="brand__name">SDLC Desk</span>
        <span className="brand__sub">Daily workbench</span>
      </span>
    </NavLink>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nav" aria-label="Main navigation">
      <NavLink to="/" end className="nav__link" onClick={onNavigate}>
        <LayoutDashboard size={18} aria-hidden="true" />
        <span>Dashboard</span>
      </NavLink>

      <p className="nav__label">Toolkit</p>
      {TOOL_LIST.map((tool) => {
        const Icon = tool.icon;
        return (
          <NavLink key={tool.id} to={tool.path} className="nav__link" onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            <span>{tool.shortName}</span>
          </NavLink>
        );
      })}

      <p className="nav__label">Organise</p>
      <NavLink to="/library" className="nav__link" onClick={onNavigate}>
        <Library size={18} aria-hidden="true" />
        <span>Library</span>
      </NavLink>
      <NavLink to="/settings" className="nav__link" onClick={onNavigate}>
        <Settings size={18} aria-hidden="true" />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="sidebar__head">
        <Brand onNavigate={onNavigate} />
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <div className="sidebar__foot">
        <div className="theme-box">
          <span className="theme-box__label">Theme</span>
          <ThemeToggle />
        </div>
        <p className="privacy-note">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>
            No account, no tracking. Your work stays in this browser.{' '}
            <NavLink to="/settings" onClick={onNavigate}>
              Privacy
            </NavLink>
          </span>
        </p>
      </div>
    </>
  );
}

export function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const storageError = useWorkspace((state) => state.storageError);
  const dismissStorageError = useWorkspace((state) => state.dismissStorageError);

  useEffect(() => {
    // Navigation can also change outside the drawer (links, browser back), so close it.
    // eslint-disable-next-line react/set-state-in-effect
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      <div className="shell">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={19} />
          </button>
          <Brand />
          <div className="topbar__spacer" />
          <ThemeToggle />
        </header>

        <main className="main" id="main-content">
          {storageError ? (
            <div className="alert alert--warning" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <div className="alert__body">
                <strong>Storage problem</strong>
                <p>{storageError}</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Dismiss storage warning"
                onClick={dismissStorageError}
              >
                <X size={15} />
              </button>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>

      {drawerOpen ? (
        <div className="drawer">
          <div className="drawer__backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="drawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">
            <button
              type="button"
              className="drawer__close icon-btn"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
