import { useState } from 'react';
import { CircleCheckIcon, MessageSquareDashedIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enter } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { api } from '../api/index.js';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { FormField, controlClass } from '../components/FormField.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { EmptyState, LoadingState } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProviders } from '../hooks/useProviders.js';
import { formatDateTime } from '../utils/format.js';
import { validateBody, validatePhone } from '../utils/validation.js';

function ResultDetail({ label, children, title }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="font-medium text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate text-sm" title={title}>
        {children}
      </dd>
    </div>
  );
}

function SendResult({ result }) {
  return (
    <section
      aria-live="polite"
      className={`relative overflow-hidden rounded-2xl border border-success/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm ${enter}`}
    >
      <div className="absolute -top-16 -right-16 size-40 rounded-full bg-success/15 blur-2xl" aria-hidden="true" />
      <div className="relative flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success ring-4 ring-success/10">
          <CircleCheckIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold">
            Accepted by provider <SimulatedBadge />
          </h2>
          <p className="text-muted-foreground text-sm">
            The provider accepted the message for sending. This does not confirm delivery to the phone.
          </p>
        </div>
      </div>
      <dl className="relative mt-4 grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4">
        <ResultDetail label="Provider">
          <code>{result.provider}</code>
        </ResultDetail>
        <ResultDetail label="Provider status">
          <code>{result.providerStatus}</code>
        </ResultDetail>
        <ResultDetail label="Message ID" title={result.providerMessageId}>
          <code>{result.providerMessageId}</code>
        </ResultDetail>
        <ResultDetail label="Accepted at" title={result.acceptedAt}>
          {formatDateTime(result.acceptedAt)}
        </ResultDetail>
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
  const showToError = touched.to && Boolean(toError);

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ to: true, body: true });
    if (toError || bodyError || send.pending) return;
    await send.run({ provider, to: to.trim(), body });
  }

  return (
    <>
      <PageHeader
        eyebrow="Single message"
        title="Send an"
        accent="SMS"
        description="Pick a provider or let the server choose its primary one, then send one message to one recipient."
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm lg:col-span-3"
        >
          <div className="space-y-1 border-b px-6 py-5">
            <h2 className="font-semibold">Compose</h2>
            <p className="text-muted-foreground text-sm">Choose a provider, add the recipient and write the message.</p>
          </div>
          <div className="space-y-6 p-6">
            <ProviderSelect
              id="send-provider"
              value={provider}
              onChange={setProvider}
              providers={providersState.providers}
              loading={providersState.loading}
              error={providersState.error}
              disabled={send.pending}
            />

            <FormField
              id="send-to"
              label="Recipient phone number"
              error={showToError ? toError : null}
              description="E.164 format, for example +919876543210."
            >
              <Input
                id="send-to"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="+919876543210"
                className={cn(controlClass, 'tabular-nums')}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, to: true }))}
                disabled={send.pending}
                aria-invalid={showToError || undefined}
                aria-describedby={showToError ? 'send-to-error' : 'send-to-description'}
              />
            </FormField>

            <MessageField
              id="send-body"
              provider={provider}
              value={body}
              onChange={setBody}
              onBlur={() => setTouched((t) => ({ ...t, body: true }))}
              error={touched.body ? bodyError : null}
              disabled={send.pending}
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
            <Button type="submit" size="lg" className="w-full rounded-full px-6 shadow-lg shadow-primary/25 sm:w-auto" disabled={send.pending}>
              {send.pending ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
              {send.pending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </form>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {send.pending && (
            <div className="rounded-2xl border bg-card/80">
              <LoadingState label="Sending message..." />
            </div>
          )}
          {send.data && <SendResult result={send.data} />}
          {!send.data && !send.error && !send.pending && (
            <div className="rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm">
              <EmptyState icon={MessageSquareDashedIcon} title="No message sent yet">
                The provider response appears here after you send.
              </EmptyState>
            </div>
          )}
          <MockHints />
        </aside>
      </div>
    </>
  );
}
