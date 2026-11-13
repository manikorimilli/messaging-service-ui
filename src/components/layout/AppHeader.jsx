import { FlaskConicalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { config } from '../../config.js';

export function Logo() {
  return (
    <a href="#/overview" aria-label="Messaging console overview" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring">
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z" />
          <path d="M8.5 9h7M8.5 12h4.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-bold tracking-tight">
        Messaging<span className="text-muted-foreground font-medium">.console</span>
      </span>
    </a>
  );
}

export function EnvironmentPill({ className }) {
  if (config.useMockApi) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-info/30 bg-info/10 px-2.5 py-1 font-medium text-info-foreground text-xs',
          className,
        )}
        title="Providers and send results are simulated in your browser. No requests reach the backend."
      >
        <FlaskConicalIcon className="size-3.5" aria-hidden="true" />
        Mock mode
      </span>
    );
  }
  const target = config.apiBaseUrl || 'same origin (proxy)';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-medium text-success-foreground text-xs',
        className,
      )}
      title={`Live backend: ${target}`}
    >
      <span className="size-1.5 rounded-full bg-success animate-pulse-dot motion-reduce:animate-none" aria-hidden="true" />
      Live
    </span>
  );
}
