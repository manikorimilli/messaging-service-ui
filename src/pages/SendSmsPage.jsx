import { useState } from 'react';
import { CircleCheckIcon, MessageSquareDashedIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '../api/index.js';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { EmptyState, LoadingState } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProviders } from '../hooks/useProviders.js';
import { formatDateTime } from '../utils/format.js';
import { validateBody, validatePhone } from '../utils/validation.js';

function ResultDetail({ label, children, title }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="truncate text-sm" title={title}>
        {children}
      </dd>
    </div>
  );
}

function SendResult({ result }) {
  return (
    <Card aria-live="polite">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <CircleCheckIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              Accepted by provider <SimulatedBadge />
            </CardTitle>
            <CardDescription>
              The provider accepted the message for sending. This does not confirm delivery to the phone.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardPanel>
        <dl className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
          <ResultDetail label="Provider">
            <code className="font-mono">{result.provider}</code>
          </ResultDetail>
          <ResultDetail label="Provider status">
            <code className="font-mono">{result.providerStatus}</code>
          </ResultDetail>
          <ResultDetail label="Message ID" title={result.providerMessageId}>
            <code className="font-mono">{result.providerMessageId}</code>
          </ResultDetail>
          <ResultDetail label="Accepted at" title={result.acceptedAt}>
            {formatDateTime(result.acceptedAt)}
          </ResultDetail>
        </dl>
      </CardPanel>
    </Card>
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
    <section className="flex flex-col gap-6">
      <PageHeader title="Send SMS" description="Send one message to one recipient." />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" render={<form onSubmit={handleSubmit} noValidate />}>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>Choose a provider, add the recipient and write the message.</CardDescription>
          </CardHeader>
          <CardPanel className="space-y-5">
            <ProviderSelect
              id="send-provider"
              value={provider}
              onChange={setProvider}
              providers={providersState.providers}
              loading={providersState.loading}
              error={providersState.error}
              disabled={send.pending}
            />

            <Field invalid={showToError}>
              <FieldLabel htmlFor="send-to">Recipient phone number</FieldLabel>
              <Input
                id="send-to"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="+919876543210"
                className="font-mono"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, to: true }))}
                disabled={send.pending}
                aria-invalid={showToError || undefined}
              />
              {showToError ? (
                <FieldError match>{toError}</FieldError>
              ) : (
                <FieldDescription>E.164 format, for example +919876543210.</FieldDescription>
              )}
            </Field>

            <MessageField
              id="send-body"
              provider={provider}
              value={body}
              onChange={setBody}
              onBlur={() => setTouched((t) => ({ ...t, body: true }))}
              error={touched.body ? bodyError : null}
              disabled={send.pending}
            />
          </CardPanel>
          <CardFooter className="justify-end">
            <Button type="submit" loading={send.pending} className="w-full sm:w-auto">
              <SendIcon aria-hidden="true" />
              {send.pending ? 'Sending...' : 'Send SMS'}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {send.data && <SendResult result={send.data} />}
          {send.pending && (
            <Card>
              <LoadingState label="Sending message..." />
            </Card>
          )}
          {!send.data && !send.error && !send.pending && (
            <Card>
              <EmptyState icon={MessageSquareDashedIcon} title="No message sent yet">
                The provider response appears here after you send.
              </EmptyState>
            </Card>
          )}
          <MockHints />
        </div>
      </div>
    </section>
  );
}
