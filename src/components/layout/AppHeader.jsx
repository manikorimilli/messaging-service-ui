import { useState } from 'react';
import { ChevronDownIcon, FlaskConicalIcon, MailIcon, MenuIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { config } from '../../config.js';
import { ThemeToggle } from './ThemeToggle.jsx';

const FUTURE_CHANNELS = [
  { label: 'Email', icon: MailIcon },
  { label: 'Call', icon: PhoneIcon },
  { label: 'WhatsApp', icon: MessageCircleIcon },
];

function Logo() {
  return (
    <a href="#/providers" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring">
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

function NavLinks({ routes, route, onNavigate, vertical }) {
  return (
    <nav aria-label="Main" className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-1'}>
      {routes.map(({ key, label, icon: Icon }) => {
        const active = route === key;
        return (
          <a
            key={key}
            href={`#/${key}`}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            // The active tab's highlight glides to the new tab during a page transition.
            style={active && !vertical ? { viewTransitionName: 'nav-active' } : undefined}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium text-sm outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring',
              vertical && 'rounded-lg px-3 py-2.5',
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border dark:bg-secondary'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground dark:hover:bg-secondary/60',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}

export function AppHeader({ routes, route }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/55">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Logo />

        <div className="mx-auto hidden rounded-full border bg-muted/60 p-1 lg:block">
          <NavLinks routes={routes} route={route} />
        </div>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden rounded-full text-muted-foreground lg:inline-flex">
                More channels
                <ChevronDownIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Coming soon</DropdownMenuLabel>
              {FUTURE_CHANNELS.map(({ label, icon: Icon }) => (
                <DropdownMenuItem key={label} disabled>
                  <Icon aria-hidden="true" />
                  {label}
                  <span className="ms-auto rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">Soon</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <EnvironmentPill />
          <ThemeToggle />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="Open navigation">
                <MenuIcon aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Messaging console</SheetTitle>
                <SheetDescription>Multi-provider SMS</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-4">
                <NavLinks routes={routes} route={route} onNavigate={() => setMenuOpen(false)} vertical />
                <div className="space-y-2">
                  <p className="px-3 font-medium text-muted-foreground text-xs">Coming soon</p>
                  {FUTURE_CHANNELS.map(({ label, icon: Icon }) => (
                    <p key={label} className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground text-sm opacity-60">
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </p>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
