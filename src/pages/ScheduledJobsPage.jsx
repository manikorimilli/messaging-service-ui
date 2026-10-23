import { useId, useState } from 'react';
import {
  CalendarClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  CopyIcon,
  LoaderIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Notice } from '../components/Notice.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { DEFAULT_PAGE_SIZE, TablePagination } from '../components/TablePagination.jsx';
import { EmptyState, LoadingState, TableSkeleton } from '../components/States.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useJobRun, useJobRuns } from '../hooks/useJobRuns.js';
import {
  formatDateTime,
  formatDuration,
  formatRelative,
  outcomeTone,
  statusTone,
} from '../utils/format.js';
import { countByFilter, filterRuns, percent, RUN_FILTERS } from '../utils/jobRuns.js';

const REFRESH_MS = 30000;
const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const panel = 'rounded-2xl border bg-card shadow-xs';

const TONE_TILE = {
  success: 'bg-success/12 text-success-foreground ring-success/25',
  warning: 'bg-warning/15 text-warning-foreground ring-warning/30',
  error: 'bg-destructive/10 text-destructive ring-destructive/25',
  info: 'bg-info/10 text-info-foreground ring-info/25',
  neutral: 'bg-muted text-muted-foreground ring-border',
};
const TONE_ICON = {
  success: CircleCheckIcon,
  warning: CircleAlertIcon,
  error: CircleXIcon,
  info: LoaderIcon,
  neutral: CircleDashedIcon,
};

function RunStatus({ status }) {
  return (
    <StatusBadge tone={statusTone(status)} dot>
      {status || 'UNKNOWN'}
    </StatusBadge>
  );
}

// Rounded icon tile in the colour of a status, or of an explicit tone.
function StatusTile({ status, tone = statusTone(status), size = 'md' }) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center ring-1',
        size === 'lg' ? 'size-12 rounded-2xl' : 'size-9 rounded-xl',
        TONE_TILE[tone],
      )}
      aria-hidden="true"
    >
      <Icon className={size === 'lg' ? 'size-5' : 'size-4'} />
    </span>
  );
}

// Accepted (green) versus failed (red) share, as a thin bar.
function OutcomeBar({ accepted, failed, total, className }) {
  const okPct = total ? (accepted / total) * 100 : 0;
  const failPct = total ? (failed / total) * 100 : 0;
  return (
    <div className={cn('flex h-1.5 w-24 gap-0.5 overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      {okPct > 0 && <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${okPct}%` }} />}
      {failPct > 0 && (
        <div className="h-full rounded-full bg-destructive/80 transition-all duration-700" style={{ width: `${failPct}%` }} />
      )}
    </div>
  );
}

// Acceptance rate as a ring. Green from 90%, amber from 50%, red below.
function AcceptanceRing({ rate, className }) {
  const value = rate ?? 0;
  const tone =
    rate == null ? 'text-muted-foreground' : value >= 90 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-destructive';
  return (
    <div className={cn('relative size-32 shrink-0', className)}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="10" className="stroke-muted" />
        {value > 0 && (
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - value / 100)}
            style={{ '--ring-length': RING_LENGTH }}
            className={cn('animate-ring-fill motion-reduce:animate-none', tone)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-3xl tracking-tight">
          {rate == null ? '-' : <NumberTicker value={value} />}
          {rate != null && <span className="text-base text-muted-foreground">%</span>}
        </span>
        <span className="text-muted-foreground text-xs">accepted</span>
      </div>
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
          tone={g.status === 'SKIPPED' ? 'neutral' : outcomeTone(g)}
          className="h-5 px-2"
          title={`${g.provider}: ${g.accepted} of ${g.total} accepted, ${g.failed} failed (${g.status})`}
        >
          {g.provider} {g.status === 'SKIPPED' ? 'skipped' : `${g.accepted}/${g.total}`}
        </StatusBadge>
      ))}
    </div>
  );
}

function FilterTabs({ value, counts, onChange }) {
  return (
    <div role="group" aria-label="Filter runs by status" className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border bg-muted/50 p-1">
      {RUN_FILTERS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-background text-foreground shadow-xs ring-1 ring-border dark:bg-secondary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Detail({ label, children, title }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="font-medium text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate font-medium text-sm" title={title}>
        {children}
      </dd>
    </div>
  );
}

function copyRunId(runId) {
  navigator.clipboard?.writeText(runId).then(
    () => toast.success('Run ID copied'),
    () => toast.error('Could not copy the run ID'),
  );
}

function ProviderGroup({ group }) {
  const rate = percent(group.accepted, group.total);
  const skipped = group.status === 'SKIPPED';

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <StatusTile tone={skipped ? 'neutral' : outcomeTone(group)} />
          <div>
            <h3 className="font-semibold text-sm">{group.provider}</h3>
            <p className="text-muted-foreground text-xs tabular-nums">
              {skipped
                ? 'Not sent'
                : `${group.accepted} of ${group.total} accepted · ${group.failed} failed`}
              {group.duplicatesRemoved ? ` · ${group.duplicatesRemoved} duplicate removed` : ''}
            </p>
          </div>
        </div>
        <div className="ms-auto flex items-center gap-3">
          {!skipped && (
            <>
              <OutcomeBar accepted={group.accepted} failed={group.failed} total={group.total} className="hidden w-28 sm:flex" />
              <span className="font-semibold text-sm tabular-nums">{rate ?? 0}%</span>
            </>
          )}
          <RunStatus status={group.status} />
        </div>
      </header>
      <div className="space-y-3 p-3">
        {group.error && (
          <Notice tone="warning" title={group.error.code || 'Group not sent'} role="note">
            {group.error.message}
          </Notice>
        )}
        {!skipped && <RecipientResultsTable results={group.results} />}
      </div>
    </section>
  );
}

function JobRunDialog({ runId, onClose }) {
  const { run, loading, error } = useJobRun(runId);
  const rate = run ? percent(run.accepted, run.total) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="job-run-details flex max-h-11/12 flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <DialogHeader className="flex-row items-center gap-4 border-b px-6 py-5 pe-12 text-left">
          {run ? <StatusTile status={run.status} size="lg" /> : <Skeleton className="size-12 rounded-2xl" />}
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
              Job run {run && <RunStatus status={run.status} />} <SimulatedBadge />
            </DialogTitle>
            <DialogDescription className="tabular-nums">
              {run ? `${formatDateTime(run.startedAt)} · ${formatRelative(run.startedAt)}` : 'Per-recipient results for each provider in this run.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="scrollbar-none min-h-0 space-y-5 overflow-y-auto p-6 [&_[data-slot=table-container]]:scrollbar-none">
          {loading && <LoadingState label="Loading run..." />}
          <ErrorAlert error={error} />
          {run && (
            <>
              {run.error && (
                <Notice tone="error" title="The run did not send anything" role="note">
                  {run.error.message || 'The backend reported an error for this run.'}
                </Notice>
              )}

              <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/30 p-5 sm:flex-row">
                <AcceptanceRing rate={rate} className="size-28" />
                <div className="w-full min-w-0 flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Recipients</p>
                      <p className="font-semibold text-2xl tabular-nums">{run.total}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Accepted</p>
                      <p className="font-semibold text-2xl text-success-foreground tabular-nums">{run.accepted}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Failed</p>
                      <p className={cn('font-semibold text-2xl tabular-nums', run.failed > 0 && 'text-destructive')}>{run.failed}</p>
                    </div>
                  </div>
                  <OutcomeBar accepted={run.accepted} failed={run.failed} total={run.total} className="h-2 w-full" />
                  <p className="text-muted-foreground text-xs">
                    Accepted means the provider queued the message. It does not confirm delivery.
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-2xl border p-4 md:grid-cols-4">
                <Detail label="Duration">{formatDuration(run.startedAt, run.finishedAt) ?? 'Still running'}</Detail>
                <Detail label="Targets version">
                  <code>{run.targetsVersion || 'unknown'}</code>
                </Detail>
                <Detail label="Providers">{(run.groups || []).length}</Detail>
                <div className="min-w-0 space-y-1">
                  <dt className="font-medium text-muted-foreground text-xs">Run ID</dt>
                  <dd className="flex items-center gap-1">
                    <code className="truncate text-sm" title={run.runId}>
                      {run.runId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 rounded-full"
                      onClick={() => copyRunId(run.runId)}
                      aria-label="Copy run ID"
                      title="Copy run ID"
                    >
                      <CopyIcon aria-hidden="true" />
                    </Button>
                  </dd>
                </div>
              </dl>

              <div className="space-y-3">
                <h3 className="font-semibold">By provider</h3>
                {(run.groups || []).map((g) => (
                  <ProviderGroup key={g.provider} group={g} />
                ))}
                {(!run.groups || run.groups.length === 0) && <EmptyState title="This run has no provider groups" />}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Short tagline across the top of the page, with a shortcut to the newest run.
function JobBanner({ latest, onOpenLatest }) {
  return (
    <section
      aria-label="About the scheduled job"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-primary/20 bg-primary/6 px-4 py-3 dark:bg-primary/10"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarClockIcon className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">Automated delivery, every day.</span>{' '}
        <span className="text-muted-foreground">Every result, tracked here.</span>
      </p>
      {latest && (
        <Button size="sm" className="h-8 rounded-full px-3.5" onClick={onOpenLatest}>
          Open latest run
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      )}
    </section>
  );
}

export function ScheduledJobsPage() {
  const switchId = useId();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { runs, loading, error, loadedAt, reload } = useJobRuns({ refreshMs: autoRefresh ? REFRESH_MS : null });
  const [openRunId, setOpenRunId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const counts = countByFilter(runs);

  // The backend returns every run at once, so filtering and pages happen here. A
  // refresh can shrink the list; the current page is clamped to the last one.
  const shown = filterRuns(runs, filter);
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRuns = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filterLabel = RUN_FILTERS.find((f) => f.key === filter).label.toLowerCase();

  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Scheduled"
        accent="job runs"
        description="Every run of the daily SMS job, newest first. Open a run to see the result for each recipient."
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

      {loading && runs.length === 0 && (
        <div className={panel}>
          <TableSkeleton label="Loading job runs..." />
        </div>
      )}

      {!loading && !error && runs.length === 0 && (
        <div className={panel}>
          <EmptyState icon={CalendarClockIcon} title="No job runs yet">
            Runs appear here after the backend scheduler has run the job.
          </EmptyState>
        </div>
      )}

      {runs.length > 0 && <JobBanner latest={runs[0]} onOpenLatest={() => setOpenRunId(runs[0].runId)} />}

      {runs.length > 0 && (
        <section className={cn(panel, 'overflow-hidden')} aria-labelledby="runs-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-6">
            <div className="space-y-0.5">
              <h2 id="runs-title" className="font-semibold">
                All runs
              </h2>
              <p className="text-muted-foreground text-sm">Select a run for per-recipient results.</p>
            </div>
            <FilterTabs
              value={filter}
              counts={counts}
              onChange={(key) => {
                setFilter(key);
                setPage(1);
              }}
            />
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={CalendarClockIcon} title={`No ${filterLabel} runs`}>
              Try another filter.
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-4 sm:ps-5">Run</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="hidden lg:table-cell">Providers</TableHead>
                  <TableHead className="hidden md:table-cell">Duration</TableHead>
                  <TableHead className="w-px pe-3 text-center sm:pe-5">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRuns.map((run) => (
                  <TableRow key={run.runId} className="group cursor-pointer *:py-3.5" onClick={() => setOpenRunId(run.runId)}>
                    <TableCell className="whitespace-normal ps-4 sm:ps-5">
                      <div className="flex items-center gap-3">
                        {/* A plain icon: the Status column already carries the colour. */}
                        <span
                          className="hidden size-9 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-muted-foreground transition-colors group-hover:text-foreground sm:flex"
                          aria-hidden="true"
                        >
                          <CalendarClockIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{formatRelative(run.startedAt) || formatDateTime(run.startedAt)}</p>
                          <p className="text-muted-foreground text-xs tabular-nums" title={run.startedAt}>
                            {formatDateTime(run.startedAt)}
                          </p>
                          <div className="mt-1.5 sm:hidden">
                            <RunStatus status={run.status} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <RunStatus status={run.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex w-24 flex-col gap-1.5 sm:w-28">
                        <div className="flex items-baseline justify-between gap-2 text-sm tabular-nums">
                          <span>
                            <strong className="font-semibold">{run.accepted}</strong>
                            <span className="text-muted-foreground">/{run.total}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">{percent(run.accepted, run.total) ?? 0}%</span>
                        </div>
                        <OutcomeBar accepted={run.accepted} failed={run.failed} total={run.total} className="w-full" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <GroupChips groups={run.groups} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {formatDuration(run.startedAt, run.finishedAt) ?? 'Running'}
                    </TableCell>
                    <TableCell className="w-px pe-3 text-center sm:pe-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        aria-label={`View run from ${formatDateTime(run.startedAt)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRunId(run.runId);
                        }}
                      >
                        <span className="max-sm:sr-only">View</span>
                        <ChevronRightIcon
                          className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {shown.length > 0 && (
            <TablePagination
              page={currentPage}
              pageCount={pageCount}
              pageSize={pageSize}
              total={shown.length}
              label="runs"
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </section>
      )}

      {loadedAt && (
        <p className="flex items-center gap-2 text-muted-foreground text-xs" role="status">
          Updated {loadedAt.toLocaleTimeString()} <SimulatedBadge />
        </p>
      )}

      {openRunId && <JobRunDialog runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </>
  );
}
