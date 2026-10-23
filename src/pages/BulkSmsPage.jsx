import { useState } from 'react';
import { CircleAlertIcon, CircleCheckIcon, MessagesSquareIcon, SendIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { api } from '../api/index.js';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { RecipientsInput } from '../components/RecipientsInput.jsx';
import { Stat } from '../components/Stat.jsx';
import { EmptyState, LoadingState } from '../components/States.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useProviders } from '../hooks/useProviders.js';
import { MAX_RECIPIENTS, mergeRecipients, validateBody, validateRecipients } from '../utils/validation.js';

const OUTCOME_ICONS = { success: CircleCheckIcon, warning: TriangleAlertIcon, error: CircleAlertIcon };

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
  const Icon = OUTCOME_ICONS[summary.tone];

  return (
    <Card aria-live="polite">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Batch result <SimulatedBadge />
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          Sent with
          <Badge variant="outline" className="font-mono">
            {result.provider}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <Alert variant={summary.tone}>
          <Icon aria-hidden="true" />
          <AlertTitle>{summary.title}</AlertTitle>
          <AlertDescription>
            <p>{summary.text}</p>
            <p>Accepted means the provider queued the message. It does not confirm delivery.</p>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total" value={result.total} />
          <Stat label="Accepted" value={result.accepted} tone="success" />
          <Stat label="Failed" value={result.failed} tone={result.failed ? 'error' : undefined} />
          <Stat label="Duplicates removed" value={result.duplicatesRemoved} />
        </div>

        <RecipientResultsTable results={result.results} />
      </CardPanel>
    </Card>
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
    <section className="flex flex-col gap-6">
      <PageHeader title="Bulk SMS" description={`Send one message to up to ${MAX_RECIPIENTS} recipients.`} />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" render={<form onSubmit={handleSubmit} noValidate />}>
          <CardHeader>
            <CardTitle>Batch message</CardTitle>
            <CardDescription>The same message goes to every recipient.</CardDescription>
          </CardHeader>
          <CardPanel className="space-y-5">
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
          </CardPanel>
          <CardFooter className="justify-end">
            <Button type="submit" loading={send.pending} className="w-full sm:w-auto">
              <SendIcon aria-hidden="true" />
              {send.pending
                ? 'Sending...'
                : recipients.length > 0
                  ? `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`
                  : 'Send bulk SMS'}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {send.pending && (
            <Card>
              <LoadingState label="Sending batch..." />
            </Card>
          )}
          {!send.data && !send.error && !send.pending && (
            <Card>
              <EmptyState icon={MessagesSquareIcon} title="No batch sent yet">
                Per-recipient results appear below after you send.
              </EmptyState>
            </Card>
          )}
          <MockHints />
        </div>
      </div>

      {send.data && <BatchResult result={send.data} />}
    </section>
  );
}
