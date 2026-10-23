import { useId, useState } from 'react';
import { CalendarClockIcon, ChevronRightIcon, InfoIcon, RefreshCwIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { Stat } from '../components/Stat.jsx';
import { EmptyState, LoadingState, TableSkeleton } from '../components/States.jsx';
import { useJobRun, useJobRuns } from '../hooks/useJobRuns.js';
import { formatDateTime, formatDuration, outcomeTone, statusTone } from '../utils/format.js';

const REFRESH_MS = 30000;
// statusTone/outcomeTone names mapped to coss Badge variants.
const BADGE_VARIANT = { success: 'success', warning: 'warning', error: 'error', info: 'info', neutral: 'secondary' };

function StatusBadge({ status }) {
  return <Badge variant={BADGE_VARIANT[statusTone(status)]}>{status || 'UNKNOWN'}</Badge>;
}

function GroupChips({ groups }) {
  if (!Array.isArray(groups) || groups.length === 0) return <span className="text-muted-foreground">none</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <Badge
          key={g.provider}
          variant={BADGE_VARIANT[outcomeTone(g)]}
          className="font-mono"
          title={`${g.provider}: ${g.accepted} of ${g.total} accepted, ${g.failed} failed (${g.status})`}
        >
          {g.provider} {g.accepted}/{g.total}
        </Badge>
      ))}
    </div>
  );
}

function Detail({ label, children, title }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="truncate text-sm" title={title}>
        {children}
      </dd>
    </div>
  );
}

function JobRunDialog({ runId, onClose }) {
  const { run, loading, error } = useJobRun(runId);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Job run details {run && <StatusBadge status={run.status} />} <SimulatedBadge />
          </DialogTitle>
          <DialogDescription>Per-recipient results for each provider in this run.</DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-5">
          {loading && <LoadingState label="Loading run..." />}
          <ErrorAlert error={error} />
          {run && (
            <>
              <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/40 p-4 md:grid-cols-4">
                <div className="col-span-2 md:col-span-4">
                  <Detail label="Run ID" title={run.runId}>
                    <code className="font-mono text-xs">{run.runId}</code>
                  </Detail>
                </div>
                <Detail label="Started" title={run.startedAt}>
                  {formatDateTime(run.startedAt)}
                </Detail>
                <Detail label="Duration">{formatDuration(run.startedAt, run.finishedAt) ?? 'Still running'}</Detail>
                <Detail label="Targets version">
                  <code className="font-mono">{run.targetsVersion || 'unknown'}</code>
                </Detail>
                <Detail label="Providers">{(run.groups || []).length}</Detail>
              </dl>

              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total" value={run.total} />
                <Stat label="Accepted" value={run.accepted} tone="success" />
                <Stat label="Failed" value={run.failed} tone={run.failed ? 'error' : undefined} />
              </div>
              <p className="text-muted-foreground text-xs">
                Accepted means the provider queued the message. It does not confirm delivery.
              </p>

              {(run.groups || []).map((g) => (
                <section key={g.provider} className="space-y-3">
                  <header className="flex flex-wrap items-center gap-2">
                    <h3 className="font-mono font-semibold text-sm">{g.provider}</h3>
                    <StatusBadge status={g.status} />
                    <span className="text-muted-foreground text-xs">
                      {g.accepted} of {g.total} accepted · {g.failed} failed
                      {g.duplicatesRemoved ? ` · ${g.duplicatesRemoved} duplicates removed` : ''}
                    </span>
                  </header>
                  <RecipientResultsTable results={g.results} />
                </section>
              ))}
              {(!run.groups || run.groups.length === 0) && <EmptyState title="This run has no provider groups" />}
            </>
          )}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

export function ScheduledJobsPage() {
  const switchId = useId();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { runs, loading, error, loadedAt, reload } = useJobRuns({ refreshMs: autoRefresh ? REFRESH_MS : null });
  const [openRunId, setOpenRunId] = useState(null);
  const latest = runs[0];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Scheduled jobs" description="Runs of the backend's scheduled SMS job, newest first.">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <Switch id={switchId} checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <Label htmlFor={switchId} className="font-normal text-sm">
            Auto-refresh every {REFRESH_MS / 1000} s
          </Label>
        </div>
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCwIcon className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
          Refresh
        </Button>
      </PageHeader>

      <Alert variant="info" role="note">
        <InfoIcon aria-hidden="true" />
        <AlertDescription>
          The backend runs this job on its own schedule and sends to the recipients in its targets file, which an
          independent system keeps up to date. This page only shows the results; it cannot start, change or stop a job.
        </AlertDescription>
      </Alert>

      <ErrorAlert error={error} />

      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Last run" value={formatDateTime(latest.startedAt)} size="sm" />
          <Stat label="Last run status" value={<StatusBadge status={latest.status} />} size="sm" />
          <Stat label="Accepted (last run)" value={`${latest.accepted} / ${latest.total}`} tone="success" />
          <Stat label="Failed (last run)" value={latest.failed} tone={latest.failed ? 'error' : undefined} />
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {loading && runs.length === 0 && <TableSkeleton label="Loading job runs..." />}
        {!loading && !error && runs.length === 0 && (
          <EmptyState icon={CalendarClockIcon} title="No job runs yet">
            Runs appear here after the backend scheduler has run the job.
          </EmptyState>
        )}
        {runs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="hidden sm:table-cell">Providers</TableHead>
                <TableHead className="hidden md:table-cell">Targets version</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="pe-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.runId}>
                  <TableCell className="whitespace-normal ps-4" title={run.startedAt}>
                    {formatDateTime(run.startedAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="tabular-nums">
                      {run.accepted} of {run.total} accepted
                    </span>
                    {run.failed > 0 && <span className="text-destructive-foreground"> · {run.failed} failed</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <GroupChips groups={run.groups} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="font-mono text-xs">{run.targetsVersion || 'unknown'}</code>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{formatDuration(run.startedAt, run.finishedAt) ?? 'Running'}</TableCell>
                  <TableCell className="pe-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setOpenRunId(run.runId)} aria-label="Run details">
                      <span className="max-sm:sr-only">Details</span>
                      <ChevronRightIcon aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {loadedAt && (
        <p className="flex items-center gap-2 text-muted-foreground text-xs" role="status">
          Updated {loadedAt.toLocaleTimeString()} <SimulatedBadge />
        </p>
      )}

      {openRunId && <JobRunDialog runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </section>
  );
}
