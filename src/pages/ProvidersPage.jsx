import { useState } from 'react';
import {
  EllipsisIcon,
  EyeIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  RefreshCwIcon,
  ServerIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toastManager } from '@/components/ui/toast';
import { api } from '../api/index.js';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { ChannelBadges, EnabledBadge, ProviderDetails, SourceBadge } from '../components/ProviderDetails.jsx';
import { ProviderForm } from '../components/ProviderForm.jsx';
import { EmptyState, LoadingState, TableSkeleton } from '../components/States.jsx';
import { config } from '../config.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProvider, useProviders } from '../hooks/useProviders.js';
import { isReadOnly, toWritePayload } from '../utils/providerConfig.js';

function notify(title) {
  toastManager.add({
    title,
    description: config.useMockApi ? 'Simulated by the mock API.' : undefined,
    type: 'success',
  });
}

function ProviderDialog({ title, description, onClose, children }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogPopup>
    </Dialog>
  );
}

function ViewProviderDialog({ id, onClose }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <ProviderDialog title={`Provider ${id}`} description="Full configuration as returned by the server." onClose={onClose}>
      <DialogPanel>
        {loading && <LoadingState label="Loading provider..." />}
        <ErrorAlert error={error} />
        {provider && <ProviderDetails provider={provider} />}
      </DialogPanel>
    </ProviderDialog>
  );
}

function EditProviderDialog({ id, onClose, onSaved }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <ProviderDialog title={`Edit ${id}`} description="Updates replace the full configuration." onClose={onClose}>
      {(loading || error) && (
        <DialogPanel>
          {loading && <LoadingState label="Loading provider..." />}
          <ErrorAlert error={error} />
        </DialogPanel>
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
  if (isReadOnly(provider)) {
    return (
      <Button variant="ghost" size="sm" onClick={onView} aria-label={`View ${provider.id}`}>
        <EyeIcon aria-hidden="true" />
        <span className="max-sm:sr-only">View</span>
      </Button>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={onView} aria-label={`View ${provider.id}`}>
        <EyeIcon aria-hidden="true" />
        <span className="max-sm:sr-only">View</span>
      </Button>
      <Menu>
        <MenuTrigger
          render={<Button variant="ghost" size="icon-sm" loading={busy} aria-label={`More actions for ${provider.id}`} />}
          disabled={locked}
        >
          <EllipsisIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={onEdit}>
            <PencilIcon aria-hidden="true" />
            Edit
          </MenuItem>
          <MenuItem onClick={onToggle}>
            {provider.enabled ? <PowerOffIcon aria-hidden="true" /> : <PowerIcon aria-hidden="true" />}
            {provider.enabled ? 'Disable' : 'Enable'}
          </MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon aria-hidden="true" />
            Unregister
          </MenuItem>
        </MenuPopup>
      </Menu>
    </div>
  );
}

export function ProvidersPage() {
  const { providers, loading, error, reload } = useProviders();
  const [dialog, setDialog] = useState(null); // { type: 'view' | 'edit' | 'register' | 'delete', provider? }
  const toggle = useAsyncAction((id, enabled) => api.setProviderEnabled(id, enabled));
  const remove = useAsyncAction((id) => api.deleteProvider(id));
  const [busyId, setBusyId] = useState(null);

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
    <section className="flex flex-col gap-6">
      <PageHeader title="Providers" description="SMS providers known to the messaging service.">
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCwIcon className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
          Refresh
        </Button>
        <Button onClick={() => setDialog({ type: 'register' })}>
          <PlusIcon aria-hidden="true" />
          Register provider
        </Button>
      </PageHeader>

      <ErrorAlert error={toggle.error} onDismiss={toggle.reset} />
      <ErrorAlert error={error} />

      <Card className="overflow-hidden p-0">
        {loading && providers.length === 0 && <TableSkeleton label="Loading providers..." />}
        {!loading && !error && providers.length === 0 && (
          <EmptyState
            icon={ServerIcon}
            title="No providers yet"
            action={
              <Button onClick={() => setDialog({ type: 'register' })}>
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
              <TableRow>
                <TableHead className="ps-4">Provider</TableHead>
                <TableHead className="hidden md:table-cell">Channels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
                <TableHead className="pe-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="ps-4">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5 font-medium">
                        {p['display-name'] || p.id}
                        {isReadOnly(p) && (
                          <LockIcon className="size-3.5 text-muted-foreground sm:hidden" aria-label="Built-in, read-only" />
                        )}
                      </span>
                      <code className="font-mono text-muted-foreground text-xs">{p.id}</code>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ChannelBadges channels={p.channels} />
                  </TableCell>
                  <TableCell>
                    <EnabledBadge enabled={p.enabled} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SourceBadge provider={p} />
                  </TableCell>
                  <TableCell className="pe-4 text-right">
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
      </Card>

      {dialog?.type === 'view' && <ViewProviderDialog id={dialog.provider.id} onClose={closeDialog} />}
      {dialog?.type === 'edit' && (
        <EditProviderDialog id={dialog.provider.id} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.type === 'register' && <RegisterProviderDialog onClose={closeDialog} onSaved={handleSaved} />}
      {dialog?.type === 'delete' && (
        <AlertDialog open onOpenChange={(open) => !open && !remove.pending && closeDialog()}>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Unregister {dialog.provider.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes <strong className="text-foreground">{dialog.provider['display-name'] || dialog.provider.id}</strong>{' '}
                and its stored credentials from the server. Sends that name this provider will fail. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {remove.error && (
              <div className="px-6 pb-4">
                <ErrorAlert error={remove.error} />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />} disabled={remove.pending}>
                Cancel
              </AlertDialogClose>
              <Button variant="destructive" loading={remove.pending} onClick={handleDelete}>
                Unregister
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}
    </section>
  );
}
