import { Loader2Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-12 text-muted-foreground text-sm" role="status">
      <Loader2Icon className="size-4 animate-spin text-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// Placeholder rows while a table loads for the first time.
export function TableSkeleton({ rows = 4, label = 'Loading...' }) {
  return (
    <div className="space-y-4 p-5" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <span className="relative mb-1 flex size-12 items-center justify-center rounded-2xl border bg-background text-primary shadow-sm">
          <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-md" aria-hidden="true" />
          <Icon className="relative size-5" aria-hidden="true" />
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-sm text-muted-foreground text-sm">{children}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
