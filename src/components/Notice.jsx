import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  info: { icon: InfoIcon, box: 'border-info/25 bg-info/6', icon_: 'text-info' },
  success: { icon: CircleCheckIcon, box: 'border-success/25 bg-success/6', icon_: 'text-success' },
  warning: { icon: TriangleAlertIcon, box: 'border-warning/35 bg-warning/8', icon_: 'text-warning' },
  error: { icon: CircleAlertIcon, box: 'border-destructive/30 bg-destructive/6', icon_: 'text-destructive' },
};

// Inline message box. Static information uses role="note"; validation results
// use role="status" so screen readers announce them politely.
export function Notice({ tone = 'info', title, children, role = 'status', className }) {
  const { icon: Icon, box, icon_ } = TONES[tone];
  return (
    <div role={role} className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', icon_)} aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}
