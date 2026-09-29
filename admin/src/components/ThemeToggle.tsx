import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTheme } from '../theme';

const options = [
  { id: 'system', label: 'System', Icon: DesktopIcon },
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex rounded-full bg-panel p-1 text-xs font-medium dark:bg-panel-dark" role="group" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={theme === option.id}
          onClick={() => setTheme(option.id)}
          aria-label={option.label}
          title={option.label}
          className={`grid h-7 w-7 place-items-center rounded-full ${
            theme === option.id
              ? 'bg-white text-ink shadow-sm dark:bg-ink dark:text-white'
              : 'text-muted dark:text-muted-dark'
          }`}
        >
          <option.Icon size={16} weight={theme === option.id ? 'fill' : 'regular'} />
        </button>
      ))}
    </div>
  );
}
