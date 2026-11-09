import { cn } from '@/lib/utils';

const TONES = {
  success: 'text-success-foreground',
  error: 'text-destructive',
  primary: 'text-highlight',
};

// Summary tile with an optional icon and an optional hint line under the value.
// size="sm" suits text values such as dates or badges.
export function Stat({ label, value, tone, size, icon: Icon, hint }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-foreground/20 motion-reduce:transition-none',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground/70 transition-colors group-hover:text-highlight" aria-hidden="true" />}
      </div>
      <div
        className={cn(
          'mt-4 font-semibold tabular-nums',
          size === 'sm' ? 'text-sm' : 'text-4xl text-titanium tracking-[-0.04em]',
          TONES[tone],
        )}
      >
        {value ?? 0}
      </div>
      {hint && <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
