import { useEffect, useState } from 'react';
import { MailIcon, MenuIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { EnvironmentPill, Logo } from './AppHeader.jsx';
import { SearchButton, SearchPalette } from './SearchPalette.jsx';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

const FUTURE_CHANNELS = [
  { label: 'Email', icon: MailIcon },
  { label: 'Call', icon: PhoneIcon },
  { label: 'WhatsApp', icon: MessageCircleIcon },
];

function SidebarLinks({ routes, route, onNavigate, onSearch, desktop = false }) {
  return (
    <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
      <div className="mb-5">
        <SearchButton onOpen={onSearch} />
      </div>
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

// Environment and theme sit straight on the sidebar under a divider, like the
// rest of the navigation, with no card around them.
function SidebarFooter() {
  return (
    <div className="shrink-0 space-y-3 border-t border-sidebar-border px-4 pt-4 pb-5">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Environment</span>
        <EnvironmentPill />
      </div>
      <ThemeSwitcher />
    </div>
  );
}

export function AppSidebar({ routes, route }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

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
        <div className="mx-4 border-b border-sidebar-border px-2 pt-6 pb-5 text-sm">
          <Logo />
        </div>
        <SidebarLinks routes={routes} route={route} onSearch={openSearch} desktop />
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
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
            </SheetHeader>
            <SidebarLinks routes={routes} route={route} onNavigate={() => setMenuOpen(false)} onSearch={openSearch} />
            <SidebarFooter />
          </SheetContent>
        </Sheet>
      </header>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} routes={routes} />
    </>
  );
}
