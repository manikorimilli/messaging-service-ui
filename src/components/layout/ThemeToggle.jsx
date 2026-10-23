import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

// One click switches between light and dark. Until the first click the app
// follows the system setting; after that the choice is remembered.
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-background/60"
      onClick={() => setPreference(next)}
      aria-label={label}
      title={label}
    >
      {resolved === 'dark' ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
