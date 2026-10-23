import { useState } from 'react';
import { CircleCheckIcon, MessagesSquareIcon, CircleXIcon, CopyMinusIcon, SendIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enter } from '@/lib/motion';
import { api } from '../api/index.js';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { MessageField } from '../components/MessageField.jsx';
import { MockHints } from '../components/MockHints.jsx';
import { Notice } from '../components/Notice.jsx';
import { ProviderSelect } from '../components/ProviderSelect.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { RecipientsInput } from '../components/RecipientsInput.jsx';
import { Stat } from '../components/Stat.jsx';
import { EmptyState, LoadingState } from '../components/States.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
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
    <section aria-live="polite" className={`space-y-5 rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6 ${enter}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-lg">
            Batch result <SimulatedBadge />
          </h2>
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            Sent with
            <StatusBadge>{result.provider}</StatusBadge>
          </p>
        </div>
      </div>

      <Notice tone={summary.tone} title={summary.title}>
        {summary.text} Accepted means the provider queued the message. It does not confirm delivery.
      </Notice>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={UsersIcon} label="Total" value={result.total} />
        <Stat icon={CircleCheckIcon} label="Accepted" value={result.accepted} tone="success" />
        <Stat icon={CircleXIcon} label="Failed" value={result.failed} tone={result.failed ? 'error' : undefined} />
        <Stat icon={CopyMinusIcon} label="Duplicates removed" value={result.duplicatesRemoved} />
      </div>

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
    <>
      <PageHeader
        eyebrow="Broadcast"
        title="Bulk"
        accent="messaging"
        description={`Send one message to up to ${MAX_RECIPIENTS} recipients and see the outcome for each number.`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm lg:col-span-3"
        >
          <div className="space-y-1 border-b px-6 py-5">
            <h2 className="font-semibold">Batch message</h2>
            <p className="text-muted-foreground text-sm">The same message goes to every recipient.</p>
          </div>
          <div className="space-y-6 p-6">
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
          </div>
          <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
            <Button type="submit" size="lg" className="w-full rounded-full px-6 shadow-lg shadow-primary/25 sm:w-auto" disabled={send.pending}>
              {send.pending ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
              {send.pending
                ? 'Sending...'
                : recipients.length > 0
                  ? `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`
                  : 'Send bulk SMS'}
            </Button>
          </div>
        </form>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <ErrorAlert error={send.error} onDismiss={send.reset} />
          {send.pending && (
            <div className="rounded-2xl border bg-card/80">
              <LoadingState label="Sending batch..." />
            </div>
          )}
          {!send.data && !send.error && !send.pending && (
            <div className="rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm">
              <EmptyState icon={MessagesSquareIcon} title="No batch sent yet">
                Per-recipient results appear below after you send.
              </EmptyState>
            </div>
          )}
          <MockHints />
        </aside>
      </div>

      {send.data && <BatchResult result={send.data} />}
    </>
  );
}
