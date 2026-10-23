import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { CalendarClockIcon, SendIcon, ServerIcon, UsersIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/lib/theme';
import { AppHeader } from './components/layout/AppHeader.jsx';
import { Backdrop } from './components/layout/Backdrop.jsx';
import { config } from './config.js';
import { BulkSmsPage } from './pages/BulkSmsPage.jsx';
import { ProvidersPage } from './pages/ProvidersPage.jsx';
import { ScheduledJobsPage } from './pages/ScheduledJobsPage.jsx';
import { SendSmsPage } from './pages/SendSmsPage.jsx';

const ROUTES = [
  { key: 'providers', label: 'Providers', icon: ServerIcon, Page: ProvidersPage },
  { key: 'send', label: 'Send SMS', icon: SendIcon, Page: SendSmsPage },
  { key: 'bulk', label: 'Bulk SMS', icon: UsersIcon, Page: BulkSmsPage },
  { key: 'scheduled', label: 'Scheduled jobs', icon: CalendarClockIcon, Page: ScheduledJobsPage },
];

function routeFromHash() {
  const key = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.some((r) => r.key === key) ? key : 'providers';
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);
  const { resolved: theme } = useTheme();

  useEffect(() => {
    const onHashChange = () => {
      const update = () => {
        flushSync(() => setRoute(routeFromHash()));
        window.scrollTo({ top: 0 });
      };
      // Cross-fade between pages with the View Transitions API where available.
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !reduceMotion) document.startViewTransition(update);
      else update();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { Page } = ROUTES.find((r) => r.key === route);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative isolate flex min-h-svh flex-col">
        <Backdrop />
        <AppHeader routes={ROUTES} route={route} />
        <main className="page-transition mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-10 pb-16 md:px-6 md:pt-14">
          {/* key resets page state when switching pages */}
          <Page key={route} />
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-muted-foreground text-xs md:px-6">
          {config.useMockApi
            ? 'Mock mode: data and send results are simulated in this browser.'
            : `Connected to ${config.apiBaseUrl || 'the backend through the dev proxy'}.`}
        </footer>
      </div>
      <Toaster theme={theme} position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}
