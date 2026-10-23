import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
];

// Three-way theme switch (light, dark, system) as a segmented control.
export function ThemeSwitcher({ className }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('grid grid-cols-3 gap-1 rounded-full border border-sidebar-border bg-background/40 p-1', className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setPreference(value)}
            className={cn(
              'flex h-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-secondary text-foreground shadow-xs ring-1 ring-border' : 'hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
