import { cn } from '@/lib/utils';

const TONES = {
  success: 'border-success/30 bg-success/10 text-success-foreground',
  warning: 'border-warning/35 bg-warning/12 text-warning-foreground',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info-foreground',
  neutral: 'border-border bg-muted text-muted-foreground',
};
const DOTS = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
};

// Rounded status label in one of five tones, optionally with a leading dot.
export function StatusBadge({ tone = 'neutral', dot, className, title, children }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-medium text-xs tabular-nums [&>svg]:size-3.5',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', DOTS[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}
