import { useState } from 'react';
import { api } from '../api/index.js';
import { Alert } from '../components/Alert.jsx';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { Modal } from '../components/Modal.jsx';
import { EnabledBadge, ProviderDetails, SourceBadge } from '../components/ProviderDetails.jsx';
import { ProviderForm } from '../components/ProviderForm.jsx';
import { EmptyState, LoadingState, Spinner } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProvider, useProviders } from '../hooks/useProviders.js';
import { isReadOnly, toWritePayload } from '../utils/providerConfig.js';

function ViewProviderModal({ id, onClose }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <Modal title={`Provider ${id}`} onClose={onClose} wide>
      {loading && <LoadingState label="Loading provider..." />}
      <ErrorAlert error={error} />
      {provider && <ProviderDetails provider={provider} />}
    </Modal>
  );
}

function EditProviderModal({ id, onClose, onSaved }) {
  const { provider, loading, error } = useProvider(id);
  return (
    <Modal title={`Edit ${id}`} onClose={onClose} wide>
      {loading && <LoadingState label="Loading provider..." />}
      <ErrorAlert error={error} />
      {provider && (
        <ProviderForm
          mode="update"
          providerId={provider.id}
          initialText={JSON.stringify(toWritePayload(provider), null, 2)}
          onSubmit={async (cfg) => onSaved(await api.updateProvider(provider.id, cfg), 'updated')}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}

function RegisterProviderModal({ onClose, onSaved }) {
  return (
    <Modal title="Register provider" onClose={onClose} wide>
      <ProviderForm
        mode="create"
        onSubmit={async (cfg) => onSaved(await api.registerProvider(cfg), 'registered')}
        onCancel={onClose}
      />
    </Modal>
  );
}

export function ProvidersPage() {
  const { providers, loading, error, reload } = useProviders();
  const [dialog, setDialog] = useState(null); // { type: 'view' | 'edit' | 'register' | 'delete', provider? }
  const [notice, setNotice] = useState(null);
  const toggle = useAsyncAction((id, enabled) => api.setProviderEnabled(id, enabled));
  const remove = useAsyncAction((id) => api.deleteProvider(id));
  const [busyId, setBusyId] = useState(null);

  const closeDialog = () => {
    setDialog(null);
    remove.reset();
  };

  function handleSaved(saved, verb) {
    setDialog(null);
    setNotice(`Provider ${saved.id} ${verb}.`);
    reload();
  }

  async function handleToggle(provider) {
    setNotice(null);
    setBusyId(provider.id);
    const result = await toggle.run(provider.id, !provider.enabled);
    setBusyId(null);
    if (result.ok) {
      setNotice(`Provider ${result.data.id} is now ${result.data.enabled ? 'enabled' : 'disabled'}.`);
      reload();
    }
  }

  async function handleDelete() {
    const { id } = dialog.provider;
    const result = await remove.run(id);
    if (result.ok) {
      closeDialog();
      setNotice(`Provider ${id} unregistered.`);
      reload();
    }
  }

  const actionsLocked = toggle.pending || remove.pending;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Providers</h1>
          <p className="muted">SMS providers known to the messaging service.</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn" onClick={reload} disabled={loading}>
            {loading && <Spinner small />} Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setNotice(null);
              setDialog({ type: 'register' });
            }}
          >
            Register provider
          </button>
        </div>
      </header>

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice} <SimulatedBadge />
        </Alert>
      )}
      <ErrorAlert error={toggle.error} onDismiss={toggle.reset} />
      <ErrorAlert error={error} />

      {loading && providers.length === 0 && <LoadingState label="Loading providers..." />}
      {!loading && !error && providers.length === 0 && (
        <EmptyState title="No providers yet">Register a provider to start sending.</EmptyState>
      )}

      {providers.length > 0 && (
        <div className="card table-card">
          <table className="table responsive-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Display name</th>
                <th>Channels</th>
                <th>Status</th>
                <th>Source</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const readOnly = isReadOnly(p);
                const busy = busyId === p.id;
                return (
                  <tr key={p.id}>
                    <td data-label="ID">
                      <code>{p.id}</code>
                    </td>
                    <td data-label="Display name">{p['display-name']}</td>
                    <td data-label="Channels">{(p.channels || []).join(', ')}</td>
                    <td data-label="Status">
                      <EnabledBadge enabled={p.enabled} />
                    </td>
                    <td data-label="Source">
                      <SourceBadge provider={p} />
                    </td>
                    <td data-label="Actions" className="actions-col">
                      <div className="row-actions">
                        <button type="button" className="btn btn-sm" onClick={() => setDialog({ type: 'view', provider: p })}>
                          View
                        </button>
                        {!readOnly && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setDialog({ type: 'edit', provider: p })}
                              disabled={actionsLocked}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleToggle(p)}
                              disabled={actionsLocked}
                            >
                              {busy && <Spinner small />} {p.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger-outline"
                              onClick={() => {
                                setNotice(null);
                                setDialog({ type: 'delete', provider: p });
                              }}
                              disabled={actionsLocked}
                            >
                              Unregister
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'view' && <ViewProviderModal id={dialog.provider.id} onClose={closeDialog} />}
      {dialog?.type === 'edit' && (
        <EditProviderModal id={dialog.provider.id} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.type === 'register' && <RegisterProviderModal onClose={closeDialog} onSaved={handleSaved} />}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title={`Unregister ${dialog.provider.id}?`}
          confirmLabel="Unregister"
          pending={remove.pending}
          error={remove.error}
          onConfirm={handleDelete}
          onCancel={closeDialog}
        >
          <p>
            This removes <strong>{dialog.provider['display-name'] || dialog.provider.id}</strong> and its stored
            credentials from the server. Sends that name this provider will fail. This cannot be undone.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
