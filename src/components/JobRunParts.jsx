import { cn } from '@/lib/utils';
import { statusTone } from '../utils/format.js';
import { StatusBadge } from './StatusBadge.jsx';

// Shared by the scheduled jobs page and the overview page.

export function RunStatus({ status }) {
  return (
    <StatusBadge tone={statusTone(status)} dot>
      {status || 'UNKNOWN'}
    </StatusBadge>
  );
}

// Accepted (green) versus failed (red) share, as a thin bar.
export function OutcomeBar({ accepted, failed, total, className }) {
  const okPct = total ? (accepted / total) * 100 : 0;
  const failPct = total ? (failed / total) * 100 : 0;
  return (
    <div className={cn('flex h-1.5 w-24 gap-0.5 overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      {okPct > 0 && <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${okPct}%` }} />}
      {failPct > 0 && (
        <div className="h-full rounded-full bg-destructive/80 transition-all duration-700" style={{ width: `${failPct}%` }} />
      )}
    </div>
  );
}
