import { HashRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './Shell';
import { useApplyTheme } from './useApplyTheme';
import { ScrollToTop } from '../components/ScrollToTop';
import { Dashboard } from '../pages/Dashboard';
import { LibraryPage } from '../pages/LibraryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RequirementsPage } from '../features/requirements/RequirementsPage';
import { TestCasesPage } from '../features/testcases/TestCasesPage';
import { BugsPage } from '../features/bugs/BugsPage';
import { StandupPage } from '../features/standup/StandupPage';
import { ReleasePage } from '../features/release/ReleasePage';
import { ChecklistsPage } from '../features/checklists/ChecklistsPage';

export default function App() {
  useApplyTheme();

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="requirements" element={<RequirementsPage />} />
          <Route path="test-cases" element={<TestCasesPage />} />
          <Route path="bugs" element={<BugsPage />} />
          <Route path="standup" element={<StandupPage />} />
          <Route path="release-notes" element={<ReleasePage />} />
          <Route path="checklists" element={<ChecklistsPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
