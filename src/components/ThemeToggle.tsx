import { Monitor, Moon, Sun } from 'lucide-react';
import { useWorkspace } from '../lib/store';
import type { ThemePreference } from '../lib/types';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const theme = useWorkspace((state) => state.settings.theme);
  const setTheme = useWorkspace((state) => state.setTheme);

  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={['theme-switch__btn', active ? 'theme-switch__btn--active' : '']
              .filter(Boolean)
              .join(' ')}
            aria-pressed={active}
            title={`${option.label} theme`}
            onClick={() => setTheme(option.value)}
          >
            <Icon size={15} aria-hidden="true" />
            <span className={showLabels ? 'theme-switch__label' : 'sr-only'}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
