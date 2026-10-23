import { useId, useState } from 'react';
import {
  CalendarClockIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  UsersIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { Stat } from '../components/Stat.jsx';
import { DEFAULT_PAGE_SIZE, TablePagination } from '../components/TablePagination.jsx';
import { EmptyState, LoadingState, TableSkeleton } from '../components/States.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useJobRun, useJobRuns } from '../hooks/useJobRuns.js';
import { formatDateTime, formatDuration, outcomeTone, statusTone } from '../utils/format.js';

const REFRESH_MS = 30000;

function RunStatus({ status }) {
  return (
    <StatusBadge tone={statusTone(status)} dot>
      {status || 'UNKNOWN'}
    </StatusBadge>
  );
}

// Accepted (green) versus failed (red) share of a run, as a thin bar.
function OutcomeBar({ accepted, failed, total }) {
  const okPct = total ? (accepted / total) * 100 : 0;
  const failPct = total ? (failed / total) * 100 : 0;
  return (
    <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <div className="h-full bg-success transition-all duration-700" style={{ width: `${okPct}%` }} />
      <div className="h-full bg-destructive/80 transition-all duration-700" style={{ width: `${failPct}%` }} />
    </div>
  );
}

function GroupChips({ groups }) {
  if (!Array.isArray(groups) || groups.length === 0) return <span className="text-muted-foreground">none</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <StatusBadge
          key={g.provider}
          tone={outcomeTone(g)}
         
          className="h-5 px-2"
          title={`${g.provider}: ${g.accepted} of ${g.total} accepted, ${g.failed} failed (${g.status})`}
        >
          {g.provider} {g.accepted}/{g.total}
        </StatusBadge>
      ))}
    </div>
  );
}

function Detail({ label, children, title }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="font-medium text-muted-foreground text-xs">{label}</dt>
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
      <DialogContent className="job-run-details flex max-h-11/12 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            Job run details {run && <RunStatus status={run.status} />} <SimulatedBadge />
          </DialogTitle>
          <DialogDescription>Per-recipient results for each provider in this run.</DialogDescription>
        </DialogHeader>
        <div className="scrollbar-none min-h-0 space-y-5 overflow-y-auto px-6 pb-6 [&_[data-slot=table-container]]:scrollbar-none">
          {loading && <LoadingState label="Loading run..." />}
          <ErrorAlert error={error} />
          {run && (
            <>
              <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-4">
                <div className="col-span-2 md:col-span-4">
                  <Detail label="Run ID" title={run.runId}>
                    <code className="text-xs">{run.runId}</code>
                  </Detail>
                </div>
                <Detail label="Started" title={run.startedAt}>
                  {formatDateTime(run.startedAt)}
                </Detail>
                <Detail label="Duration">{formatDuration(run.startedAt, run.finishedAt) ?? 'Still running'}</Detail>
                <Detail label="Targets version">
                  <code>{run.targetsVersion || 'unknown'}</code>
                </Detail>
                <Detail label="Providers">{(run.groups || []).length}</Detail>
              </dl>

              <div className="grid grid-cols-3 gap-3">
                <Stat icon={UsersIcon} label="Total" value={run.total} />
                <Stat icon={CircleCheckIcon} label="Accepted" value={run.accepted} tone="success" />
                <Stat icon={CircleXIcon} label="Failed" value={run.failed} tone={run.failed ? 'error' : undefined} />
              </div>
              <p className="text-muted-foreground text-xs">Accepted means the provider queued the message. It does not confirm delivery.</p>

              {(run.groups || []).map((g) => (
                <section key={g.provider} className="space-y-3">
                  <header className="flex flex-wrap items-center gap-2">
                    <h3 className="tabular-nums font-semibold text-sm">{g.provider}</h3>
                    <RunStatus status={g.status} />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduledJobsPage() {
  const switchId = useId();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { runs, loading, error, loadedAt, reload } = useJobRuns({ refreshMs: autoRefresh ? REFRESH_MS : null });
  const [openRunId, setOpenRunId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const latest = runs[0];

  // The backend returns every run at once, so pages are cut here. A refresh can
  // shrink the list; the current page is clamped to the last one that exists.
  const pageCount = Math.max(1, Math.ceil(runs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRuns = runs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Scheduled"
        accent="job runs"
        description="Results of the  scheduled SMS job, newest first."
      >
        <div className="flex h-10 items-center gap-2.5 rounded-full border bg-background/60 px-4">
          <Switch id={switchId} checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <Label htmlFor={switchId} className="font-medium text-sm">
            Auto-refresh {REFRESH_MS / 1000}s
          </Label>
        </div>
        <RefreshButton onClick={reload} loading={loading} />
      </PageHeader>

      <ErrorAlert error={error} />

      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={ClockIcon} label="Last run" value={formatDateTime(latest.startedAt)} size="sm" />
          <Stat icon={CalendarClockIcon} label="Last run status" value={<RunStatus status={latest.status} />} size="sm" />
          <Stat icon={CircleCheckIcon} label="Accepted (last run)" value={`${latest.accepted} / ${latest.total}`} tone="success" />
          <Stat icon={CircleXIcon} label="Failed (last run)" value={latest.failed} tone={latest.failed ? 'error' : undefined} />
        </div>
      )}

      <section
        className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm"
        aria-label="Job runs"
      >
        {loading && runs.length === 0 && <TableSkeleton label="Loading job runs..." />}
        {!loading && !error && runs.length === 0 && (
          <EmptyState icon={CalendarClockIcon} title="No job runs yet">
            Runs appear here after the backend scheduler has run the job.
          </EmptyState>
        )}
        {runs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 ps-4 sm:ps-5">Started</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="hidden sm:table-cell">Providers</TableHead>
                <TableHead className="hidden md:table-cell">Targets</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="pe-3 text-right sm:pe-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRuns.map((run) => (
                <TableRow key={run.runId} className="cursor-pointer *:py-4" onClick={() => setOpenRunId(run.runId)}>
                  <TableCell className="whitespace-normal ps-4 font-medium sm:ps-5" title={run.startedAt}>
                    {formatDateTime(run.startedAt)}
                    <div className="mt-1.5 sm:hidden">
                      <RunStatus status={run.status} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <RunStatus status={run.status} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm tabular-nums">
                        {run.accepted}/{run.total} accepted
                        {run.failed > 0 && <span className="text-destructive"> · {run.failed} failed</span>}
                      </span>
                      <OutcomeBar accepted={run.accepted} failed={run.failed} total={run.total} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <GroupChips groups={run.groups} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="text-xs">{run.targetsVersion || 'unknown'}</code>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {formatDuration(run.startedAt, run.finishedAt) ?? 'Running'}
                  </TableCell>
                  <TableCell className="pe-3 text-right sm:pe-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      aria-label="Run details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenRunId(run.runId);
                      }}
                    >
                      <span className="max-sm:sr-only">Details</span>
                      <ChevronRightIcon aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {runs.length > 0 && (
          <TablePagination
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={runs.length}
            label="runs"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </section>

      {loadedAt && (
        <p className="flex items-center gap-2 text-muted-foreground text-xs" role="status">
          Updated {loadedAt.toLocaleTimeString()} <SimulatedBadge />
        </p>
      )}

      {openRunId && <JobRunDialog runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </>
  );
}
