import { cn } from '@/lib/utils';

const TONES = {
  success: 'text-success-foreground',
  error: 'text-destructive',
  primary: 'text-primary',
};

// Summary tile with an optional icon. size="sm" suits text values such as dates or badges.
export function Stat({ label, value, tone, size, icon: Icon }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-muted-foreground text-xs">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground/70 transition-colors group-hover:text-primary" aria-hidden="true" />}
      </div>
      <div
        className={cn(
          'mt-2 font-semibold tabular-nums tracking-tight',
          size === 'sm' ? 'text-sm' : 'text-3xl',
          TONES[tone],
        )}
      >
        {value ?? 0}
      </div>
    </div>
  );
}
