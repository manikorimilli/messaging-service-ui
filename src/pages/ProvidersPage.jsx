import { useState } from 'react';
import {
  CircleCheckIcon,
  EllipsisIcon,
  EyeIcon,
  LockIcon,
  PencilIcon,
  PlugZapIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  ServerIcon,
  Trash2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '../api/index.js';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { ChannelBadges, EnabledBadge, ProviderDetails } from '../components/ProviderDetails.jsx';
import { ProviderForm } from '../components/ProviderForm.jsx';
import { Stat } from '../components/Stat.jsx';
import { EmptyState, LoadingState, TableSkeleton } from '../components/States.jsx';
import { config } from '../config.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProvider, useProviders } from '../hooks/useProviders.js';
import { isReadOnly, toWritePayload } from '../utils/providerConfig.js';

function notify(title) {
  toast.success(title, { description: config.useMockApi ? 'Simulated by the mock API.' : undefined });
}

const spinner = <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;

function ProviderDialog({ title, description, onClose, children }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-11/12 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function ViewProviderDialog({ id, onClose }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <ProviderDialog title={`Provider ${id}`} description="Full configuration as returned by the server." onClose={onClose}>
      <div className="min-h-0 overflow-y-auto px-6 pb-6">
        {loading && <LoadingState label="Loading provider..." />}
        <ErrorAlert error={error} />
        {provider && <ProviderDetails provider={provider} />}
      </div>
    </ProviderDialog>
  );
}

function EditProviderDialog({ id, onClose, onSaved }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <ProviderDialog title={`Edit ${id}`} description="Updates replace the full configuration." onClose={onClose}>
      {(loading || error) && (
        <div className="px-6 pb-6">
          {loading && <LoadingState label="Loading provider..." />}
          <ErrorAlert error={error} />
        </div>
      )}
      {provider && (
        <ProviderForm
          mode="update"
          providerId={provider.id}
          initialText={JSON.stringify(toWritePayload(provider), null, 2)}
          onSubmit={async (cfg) => onSaved(await api.updateProvider(provider.id, cfg), 'updated')}
          onCancel={onClose}
        />
      )}
    </ProviderDialog>
  );
}

function RegisterProviderDialog({ onClose, onSaved }) {
  return (
    <ProviderDialog title="Register provider" description="Add an SMS provider from a JSON configuration." onClose={onClose}>
      <ProviderForm
        mode="create"
        onSubmit={async (cfg) => onSaved(await api.registerProvider(cfg), 'registered')}
        onCancel={onClose}
      />
    </ProviderDialog>
  );
}

function RowActions({ provider, locked, busy, onView, onEdit, onToggle, onDelete }) {
  const view = (
    <Button variant="ghost" size="sm" className="rounded-full" onClick={onView} aria-label={`View ${provider.id}`}>
      <EyeIcon aria-hidden="true" />
      <span className="max-sm:sr-only">View</span>
    </Button>
  );
  // Built-in providers get the same (disabled) menu button so every row lines up.
  // A disabled button fires no hover or focus events, so the tooltip sits on a wrapper.
  if (isReadOnly(provider)) {
    return (
      <div className="flex items-center justify-center gap-1">
        {view}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="inline-flex cursor-not-allowed rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring"
              aria-label={`${provider.id} is built-in and read-only. No other actions.`}
            >
              <Button variant="ghost" size="icon-sm" className="pointer-events-none rounded-full" disabled tabIndex={-1} aria-hidden="true">
                <EllipsisIcon />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Built-in provider: read-only</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {view}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={locked}>
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={`More actions for ${provider.id}`}>
            {busy ? spinner : <EllipsisIcon aria-hidden="true" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggle}>
            {provider.enabled ? <PowerOffIcon aria-hidden="true" /> : <PowerIcon aria-hidden="true" />}
            {provider.enabled ? 'Disable' : 'Enable'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon aria-hidden="true" />
            Unregister
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ProvidersPage() {
  const { providers, loading, error, reload } = useProviders();
  const [dialog, setDialog] = useState(null); // { type: 'view' | 'edit' | 'register' | 'delete', provider? }
  const toggle = useAsyncAction((id, enabled) => api.setProviderEnabled(id, enabled));
  const remove = useAsyncAction((id) => api.deleteProvider(id));
  const [busyId, setBusyId] = useState(null);

  const enabledCount = providers.filter((p) => p.enabled).length;
  const builtInCount = providers.filter(isReadOnly).length;

  const closeDialog = () => {
    setDialog(null);
    remove.reset();
  };

  function handleSaved(saved, verb) {
    setDialog(null);
    notify(`Provider ${saved.id} ${verb}`);
    reload();
  }

  async function handleToggle(provider) {
    setBusyId(provider.id);
    const result = await toggle.run(provider.id, !provider.enabled);
    setBusyId(null);
    if (result.ok) {
      notify(`Provider ${result.data.id} is now ${result.data.enabled ? 'enabled' : 'disabled'}`);
      reload();
    }
  }

  async function handleDelete() {
    const { id } = dialog.provider;
    const result = await remove.run(id);
    if (result.ok) {
      closeDialog();
      notify(`Provider ${id} unregistered`);
      reload();
    }
  }

  const actionsLocked = toggle.pending || remove.pending;

  return (
    <>
      <PageHeader
        eyebrow="SMS gateway"
        title="Manage your"
        accent="providers"
        description="Every SMS provider the messaging service can route through, built-in or added through the API."
      >
        <RefreshButton onClick={reload} loading={loading} />
        <Button size="lg" className="rounded-full px-5 shadow-lg shadow-primary/25" onClick={() => setDialog({ type: 'register' })}>
          <PlusIcon aria-hidden="true" />
          Register provider
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={ServerIcon} label="Providers" value={providers.length} />
        <Stat icon={CircleCheckIcon} label="Enabled" value={enabledCount} tone="success" />
        <Stat icon={LockIcon} label="Built-in" value={builtInCount} />
        <Stat icon={PlugZapIcon} label="Added via API" value={providers.length - builtInCount} tone="primary" />
      </div>

      <ErrorAlert error={toggle.error} onDismiss={toggle.reset} />
      <ErrorAlert error={error} />

      <section
        className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm"
        aria-label="Providers"
      >
        {loading && providers.length === 0 && <TableSkeleton label="Loading providers..." />}
        {!loading && !error && providers.length === 0 && (
          <EmptyState
            icon={ServerIcon}
            title="No providers yet"
            action={
              <Button className="rounded-full" onClick={() => setDialog({ type: 'register' })}>
                <PlusIcon aria-hidden="true" />
                Register provider
              </Button>
            }
          >
            Register a provider to start sending.
          </EmptyState>
        )}
        {providers.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 ps-4 sm:ps-5">ID</TableHead>
                <TableHead className="hidden sm:table-cell">Display name</TableHead>
                <TableHead className="hidden md:table-cell">Channels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-px pe-3 text-center sm:pe-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-3.5 ps-4 sm:ps-5">
                    <code className="rounded-md bg-muted px-2 py-1 font-semibold text-xs">{p.id}</code>
                    {/* On phones the display name sits under the ID instead of in its own column. */}
                    <span className="mt-1.5 block text-sm sm:hidden">{p['display-name'] || p.id}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-medium">{p['display-name'] || p.id}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ChannelBadges channels={p.channels} />
                  </TableCell>
                  <TableCell>
                    <EnabledBadge enabled={p.enabled} />
                  </TableCell>
                  <TableCell className="w-px pe-3 sm:pe-5">
                    <RowActions
                      provider={p}
                      locked={actionsLocked}
                      busy={busyId === p.id}
                      onView={() => setDialog({ type: 'view', provider: p })}
                      onEdit={() => setDialog({ type: 'edit', provider: p })}
                      onToggle={() => handleToggle(p)}
                      onDelete={() => setDialog({ type: 'delete', provider: p })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {dialog?.type === 'view' && <ViewProviderDialog id={dialog.provider.id} onClose={closeDialog} />}
      {dialog?.type === 'edit' && <EditProviderDialog id={dialog.provider.id} onClose={closeDialog} onSaved={handleSaved} />}
      {dialog?.type === 'register' && <RegisterProviderDialog onClose={closeDialog} onSaved={handleSaved} />}
      {dialog?.type === 'delete' && (
        <AlertDialog open onOpenChange={(open) => !open && !remove.pending && closeDialog()}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Unregister {dialog.provider.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes <strong className="text-foreground">{dialog.provider['display-name'] || dialog.provider.id}</strong> and
                its stored credentials from the server. Sends that name this provider will fail. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ErrorAlert error={remove.error} />
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full" disabled={remove.pending}>
                Cancel
              </AlertDialogCancel>
              <Button variant="destructive" className="rounded-full" disabled={remove.pending} onClick={handleDelete}>
                {remove.pending && spinner}
                Unregister
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
