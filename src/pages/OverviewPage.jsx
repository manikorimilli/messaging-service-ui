import { ArrowRightIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProviders } from '../hooks/useProviders.js';

// A hidden page: nothing in the app links here. It opens at /overview (or #/overview)
// and is a short, centered introduction to the console.
export function OverviewPage() {
  const { providers } = useProviders();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-12 text-center">
      <p className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3.5 py-1.5 font-medium text-muted-foreground text-sm">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Multi-provider notification service
      </p>

      <h1 className="mt-8 font-semibold text-5xl text-titanium leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
        One service.
        <br />
        <span className="text-primary">Every provider.</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
        Connect any SMS gateway from a JSON file, then send one message, a batch, or a daily scheduled run.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="h-11 rounded-full px-6">
          <a href="#/send">
            <SendIcon aria-hidden="true" />
            Send SMS
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 rounded-full bg-background/60 px-6">
          <a href="#/providers">
            View providers
            <ArrowRightIcon aria-hidden="true" />
          </a>
        </Button>
      </div>

      {providers.length > 0 && (
        <div className="mt-16 w-full border-t pt-8">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">Connected providers</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
            {providers.map((p) => (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-2 font-semibold text-lg tracking-tight',
                  p.enabled ? 'text-foreground/80' : 'text-muted-foreground/50',
                )}
                title={p.enabled ? 'Enabled' : 'Disabled'}
              >
                <span
                  className={cn('size-1.5 rounded-full', p.enabled ? 'bg-success' : 'bg-muted-foreground/40')}
                  aria-hidden="true"
                />
                {p['display-name'] || p.id}
                {!p.enabled && <span className="sr-only">(disabled)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
