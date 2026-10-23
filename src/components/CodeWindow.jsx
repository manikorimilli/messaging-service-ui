import { cn } from '@/lib/utils';

// A code panel framed like an app window, used for provider configurations.
export function CodeWindow({ title, children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-muted/40 dark:bg-black/30', className)}>
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2 dark:bg-white/3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
        </span>
        {title && <span className="ms-2 font-mono text-muted-foreground text-xs">{title}</span>}
      </div>
      {children}
    </div>
  );
}
