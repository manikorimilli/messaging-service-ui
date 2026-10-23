import { useState } from 'react';
import { api } from '../api/index.js';
import { Alert } from '../components/Alert.jsx';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { RecipientsInput } from '../components/RecipientsInput.jsx';
import { Stat } from '../components/Stat.jsx';
import { Spinner } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProviders } from '../hooks/useProviders.js';
import { MAX_RECIPIENTS, mergeRecipients, validateBody, validateRecipients } from '../utils/validation.js';

function outcome(result) {
  if (result.failed === 0) {
    return { tone: 'success', title: 'Accepted by provider', text: 'Every recipient was accepted for sending.' };
  }
  if (result.accepted === 0) {
    return { tone: 'error', title: 'No recipients accepted', text: 'The provider did not accept any recipient. See the errors below.' };
  }
  return {
    tone: 'warning',
    title: 'Partially accepted',
    text: `${result.accepted} accepted and ${result.failed} failed. Only the failed recipients need attention; do not resend to the accepted ones.`,
  };
}

function BatchResult({ result }) {
  const summary = outcome(result);

  return (
    <section className="card result" aria-live="polite">
      <header className="result-header">
        <h2>Batch result</h2>
        <SimulatedBadge />
      </header>
      <Alert tone={summary.tone} title={summary.title}>
        <p>{summary.text}</p>
        <p className="hint">Accepted means the provider queued the message. It does not confirm delivery.</p>
      </Alert>

      <div className="stats">
        <Stat label="Total" value={result.total} />
        <Stat label="Accepted" value={result.accepted} tone="success" />
        <Stat label="Failed" value={result.failed} tone={result.failed ? 'error' : undefined} />
        <Stat label="Duplicates removed" value={result.duplicatesRemoved} />
      </div>
      <p className="hint">
        Provider: <code>{result.provider}</code>
      </p>

      <RecipientResultsTable results={result.results} />
    </section>
  );
}

export function BulkSmsPage() {
  const providersState = useProviders();
  const [provider, setProvider] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState(null);
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState({ recipients: false, body: false });
  const send = useAsyncAction((input) => api.sendBatchSms(input));

  const listError = validateRecipients(recipients);
  const recipientsError = draftError || (touched.recipients ? listError : null);
  const bodyError = validateBody(body);

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ recipients: true, body: true });
    if (send.pending) return;

    // A number typed but not yet added with Enter is added now.
    let list = recipients;
    if (draft.trim()) {
      const merged = mergeRecipients(recipients, draft);
      const leftover = [...merged.invalid, ...merged.overflow];
      list = merged.recipients;
      setRecipients(list);
      setDraft(leftover.join(', '));
      if (leftover.length) {
        setDraftError('Some numbers in the box were not added. Fix or remove them before sending.');
        return;
      }
    }
    if (validateRecipients(list) || bodyError) return;
    await send.run({ provider, recipients: list, body });
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Bulk SMS</h1>
          <p className="muted">Send one message to up to {MAX_RECIPIENTS} recipients.</p>
        </div>
      </header>

      <div className="two-col">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <ProviderSelect
            id="bulk-provider"
            value={provider}
            onChange={setProvider}
            providers={providersState.providers}
            loading={providersState.loading}
            error={providersState.error}
            disabled={send.pending}
          />

          <RecipientsInput
            id="bulk-recipients"
            recipients={recipients}
            onChange={setRecipients}
            draft={draft}
            onDraftChange={(value) => {
              setDraft(value);
              setDraftError(null);
            }}
            error={recipientsError}
            disabled={send.pending}
          />

          <MessageField
            id="bulk-body"
            provider={provider}
            value={body}
            onChange={setBody}
            onBlur={() => setTouched((t) => ({ ...t, body: true }))}
            error={touched.body ? bodyError : null}
            disabled={send.pending}
          />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={send.pending}>
              {send.pending ? (
                <>
                  <Spinner small /> Sending...
                </>
              ) : recipients.length > 0 ? (
                `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`
              ) : (
                'Send bulk SMS'
              )}
            </button>
          </div>
        </form>

        <div className="stack">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {!send.data && !send.error && (
            <div className="card placeholder">
              <p className="muted">Per-recipient results will appear here after you send.</p>
            </div>
          )}
          <MockHints />
        </div>
      </div>

      {send.data && <BatchResult result={send.data} />}

    </section>
  );
}
