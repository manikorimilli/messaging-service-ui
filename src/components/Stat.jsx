import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TONES = {
  success: 'text-success-foreground',
  error: 'text-destructive-foreground',
};

// Summary tile. size="sm" suits text values such as dates or badges.
export function Stat({ label, value, tone, size }) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span
        className={cn(
          'font-semibold tabular-nums tracking-tight',
          size === 'sm' ? 'text-sm' : 'text-2xl',
          TONES[tone],
        )}
      >
        {value ?? 0}
      </span>
    </Card>
  );
}
