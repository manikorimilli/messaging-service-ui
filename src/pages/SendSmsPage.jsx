import { useState } from 'react';
import { api } from '../api/index.js';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { Spinner } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProviders } from '../hooks/useProviders.js';
import { formatDateTime } from '../utils/format.js';
import { validateBody, validatePhone } from '../utils/validation.js';

function SendResult({ result }) {
  return (
    <section className="card result result-success" aria-live="polite">
      <header className="result-header">
        <h2>Accepted by provider</h2>
        <SimulatedBadge />
      </header>
      <p className="muted">
        The provider accepted the message for sending. This does not confirm delivery to the phone.
      </p>
      <dl className="details">
        <div>
          <dt>Provider</dt>
          <dd>
            <code>{result.provider}</code>
          </dd>
        </div>
        <div>
          <dt>Message ID</dt>
          <dd>
            <code className="break">{result.providerMessageId}</code>
          </dd>
        </div>
        <div>
          <dt>Provider status</dt>
          <dd>
            <code>{result.providerStatus}</code>
          </dd>
        </div>
        <div>
          <dt>Accepted at</dt>
          <dd title={result.acceptedAt}>{formatDateTime(result.acceptedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SendSmsPage() {
  const providersState = useProviders();
  const [provider, setProvider] = useState('');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState({ to: false, body: false });
  const send = useAsyncAction((input) => api.sendSms(input));

  const toError = validatePhone(to);
  const bodyError = validateBody(body);

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ to: true, body: true });
    if (toError || bodyError || send.pending) return;
    await send.run({ provider, to: to.trim(), body });
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Send SMS</h1>
          <p className="muted">Send one message to one recipient.</p>
        </div>
      </header>

      <div className="two-col">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <ProviderSelect
            id="send-provider"
            value={provider}
            onChange={setProvider}
            providers={providersState.providers}
            loading={providersState.loading}
            error={providersState.error}
            disabled={send.pending}
          />

          <div className="field">
            <label htmlFor="send-to">Recipient phone number</label>
            <input
              id="send-to"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="+919876543210"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, to: true }))}
              disabled={send.pending}
              aria-invalid={touched.to && Boolean(toError)}
            />
            {touched.to && toError ? (
              <p className="field-error">{toError}</p>
            ) : (
              <p className="hint">E.164 format, for example +919876543210.</p>
            )}
          </div>

          <MessageField
            id="send-body"
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
              ) : (
                'Send SMS'
              )}
            </button>
          </div>
        </form>

        <div className="stack">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {send.data && <SendResult result={send.data} />}
          {!send.data && !send.error && (
            <div className="card placeholder">
              <p className="muted">The provider response will appear here after you send.</p>
            </div>
          )}
          <MockHints />
        </div>
      </div>
    </section>
  );
}
