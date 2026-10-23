import { useEffect, useState } from 'react';
import { ArrowUpRightIcon, MailIcon, MenuIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { EnvironmentPill, Logo } from './AppHeader.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const FUTURE_CHANNELS = [
  { label: 'Email', icon: MailIcon },
  { label: 'Call', icon: PhoneIcon },
  { label: 'WhatsApp', icon: MessageCircleIcon },
];

function SidebarLinks({ routes, route, onNavigate, desktop = false }) {
  return (
    <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 py-6">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
      <nav aria-label="Main" className="space-y-1.5">
        {routes.map(({ key, label, icon: Icon }) => {
          const active = route === key;
          return (
            <a
              key={key}
              href={`#/${key}`}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              style={active && desktop ? { viewTransitionName: 'nav-active' } : undefined}
              className={cn(
                'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary/10 text-foreground ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )}
            >
              <Icon className={cn('size-4 shrink-0', active && 'text-primary')} aria-hidden="true" />
              {label}
              {active && <span className="ms-auto size-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-sidebar-border pt-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">More channels</p>
        <ul className="space-y-1">
          {FUTURE_CHANNELS.map(({ label, icon: Icon }) => (
            <li key={label} className="flex min-h-10 items-center gap-3 px-3 text-sm text-muted-foreground/70">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
              <span className="ms-auto rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px]">Soon</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="mx-4 mb-4 shrink-0 rounded-xl border border-sidebar-border bg-background/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Environment</span>
        <EnvironmentPill />
      </div>
      <div className="flex items-center justify-between border-t border-sidebar-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Appearance</span>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppSidebar({ routes, route }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Release the mobile dialog's focus trap if the viewport becomes desktop.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <>
      <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="mx-4 border-b border-sidebar-border px-2 pt-7 pb-6 text-sm">
          <Logo />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            Your messaging workspace <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </p>
        </div>
        <SidebarLinks routes={routes} route={route} desktop />
        <SidebarFooter />
      </aside>

      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-sidebar/90 px-4 backdrop-blur-xl lg:hidden">
        <div className="text-sm"><Logo /></div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation"><MenuIcon aria-hidden="true" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 max-w-[calc(100%-2rem)] gap-0 bg-sidebar text-sidebar-foreground data-[side=left]:w-72">
            <SheetHeader className="border-b px-7 py-6">
              <SheetTitle>Messaging console</SheetTitle>
              <SheetDescription>Your messaging workspace</SheetDescription>
            </SheetHeader>
            <SidebarLinks routes={routes} route={route} onNavigate={() => setMenuOpen(false)} />
            <SidebarFooter />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
