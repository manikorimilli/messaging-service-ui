import { useEffect, useState } from 'react';
import {
  CalendarClockIcon,
  FlaskConicalIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  SendIcon,
  ServerIcon,
  UsersIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { config } from './config.js';
import { BulkSmsPage } from './pages/BulkSmsPage.jsx';
import { ProvidersPage } from './pages/ProvidersPage.jsx';
import { ScheduledJobsPage } from './pages/ScheduledJobsPage.jsx';
import { SendSmsPage } from './pages/SendSmsPage.jsx';

const ROUTES = {
  providers: { label: 'Providers', icon: ServerIcon, Page: ProvidersPage },
  send: { label: 'Send SMS', icon: SendIcon, Page: SendSmsPage },
  bulk: { label: 'Bulk SMS', icon: UsersIcon, Page: BulkSmsPage },
  scheduled: { label: 'Scheduled jobs', icon: CalendarClockIcon, Page: ScheduledJobsPage },
};
const FUTURE_CHANNELS = [
  { label: 'Email', icon: MailIcon },
  { label: 'Call', icon: PhoneIcon },
  { label: 'WhatsApp', icon: MessageCircleIcon },
];

function routeFromHash() {
  const key = window.location.hash.replace(/^#\/?/, '');
  return ROUTES[key] ? key : 'providers';
}

function EnvironmentStatus() {
  if (config.useMockApi) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
        <FlaskConicalIcon className="size-3.5 shrink-0 text-info" aria-hidden="true" />
        <span className="font-medium">Mock API</span>
        <span className="truncate text-muted-foreground">simulated data</span>
      </div>
    );
  }
  const target = config.apiBaseUrl || 'same origin (proxy)';
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs" title={`Base URL: ${target}`}>
      <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
      <span className="font-medium">Live</span>
      <span className="truncate text-muted-foreground">{target}</span>
    </div>
  );
}

function AppSidebar({ route }) {
  const { isMobile, setOpenMobile } = useSidebar();
  // On phones the sidebar is a sheet; close it after picking a page.
  const closeOnMobile = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <MessageSquareTextIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-semibold text-sm text-foreground">Messaging Console</p>
            <p className="truncate text-xs">Multi-provider SMS</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Messaging</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(ROUTES).map(([key, { label, icon: Icon }]) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    isActive={route === key}
                    tooltip={label}
                    render={<a href={`#/${key}`} aria-current={route === key ? 'page' : undefined} onClick={closeOnMobile} />}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Coming soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {FUTURE_CHANNELS.map(({ label, icon: Icon }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton disabled aria-disabled="true" title="Planned. Not supported by the backend yet.">
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>Soon</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <EnvironmentStatus />
      </SidebarFooter>
    </Sidebar>
  );
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { label, Page } = ROUTES[route];

  return (
    <ToastProvider>
      <SidebarProvider>
        <AppSidebar route={route} />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:rounded-t-xl">
            <SidebarTrigger className="-ms-1" aria-label="Toggle navigation" />
            <Separator orientation="vertical" className="me-1 h-4" />
            <span className="font-medium text-sm">{label}</span>
            {config.useMockApi && (
              <Badge
                variant="info"
                className="ms-auto"
                title="Providers and send results are simulated in your browser. No requests reach the backend."
              >
                <FlaskConicalIcon aria-hidden="true" />
                Mock mode
              </Badge>
            )}
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-8">
            {/* key resets page state when switching pages */}
            <Page key={route} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ToastProvider>
  );
}
