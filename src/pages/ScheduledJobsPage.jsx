import { useState } from 'react';
import { Alert } from '../components/Alert.jsx';
import { Badge, SimulatedBadge } from '../components/Badge.jsx';
import { ErrorAlert } from '../components/ErrorAlert.jsx';
import { Modal } from '../components/Modal.jsx';
import { RecipientResultsTable } from '../components/RecipientResultsTable.jsx';
import { Stat } from '../components/Stat.jsx';
import { EmptyState, LoadingState, Spinner } from '../components/States.jsx';
import { useJobRun, useJobRuns } from '../hooks/useJobRuns.js';
import { formatDateTime, formatDuration, outcomeTone, statusTone } from '../utils/format.js';

const REFRESH_MS = 30000;

function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{status || 'UNKNOWN'}</Badge>;
}

function GroupChips({ groups }) {
  if (!Array.isArray(groups) || groups.length === 0) return <span className="muted">none</span>;
  return (
    <div className="group-chips">
      {groups.map((g) => (
        <Badge
          key={g.provider}
          tone={outcomeTone(g)}
          title={`${g.provider}: ${g.accepted} of ${g.total} accepted, ${g.failed} failed (${g.status})`}
        >
          {g.provider} {g.accepted}/{g.total}
        </Badge>
      ))}
    </div>
  );
}

function JobRunModal({ runId, onClose }) {
  const { run, loading, error } = useJobRun(runId);

  return (
    <Modal title="Job run details" onClose={onClose} wide>
      {loading && <LoadingState label="Loading run..." />}
      <ErrorAlert error={error} />
      {run && (
        <div className="stack">
          <dl className="details">
            <div>
              <dt>Run ID</dt>
              <dd>
                <code className="break">{run.runId}</code>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={run.status} /> <SimulatedBadge />
              </dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd title={run.startedAt}>{formatDateTime(run.startedAt)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(run.startedAt, run.finishedAt) ?? 'Still running'}</dd>
            </div>
            <div>
              <dt>Targets version</dt>
              <dd>
                <code>{run.targetsVersion || 'unknown'}</code>
              </dd>
            </div>
          </dl>

          <div className="stats stats-3">
            <Stat label="Total" value={run.total} />
            <Stat label="Accepted" value={run.accepted} tone="success" />
            <Stat label="Failed" value={run.failed} tone={run.failed ? 'error' : undefined} />
          </div>
          <p className="hint">Accepted means the provider queued the message. It does not confirm delivery.</p>

          {(run.groups || []).map((g) => (
            <section key={g.provider} className="run-group">
              <header className="result-header">
                <h3>
                  <code>{g.provider}</code>
                </h3>
                <StatusBadge status={g.status} />
                <span className="muted">
                  {g.accepted} of {g.total} accepted · {g.failed} failed
                  {g.duplicatesRemoved ? ` · ${g.duplicatesRemoved} duplicates removed` : ''}
                </span>
              </header>
              <RecipientResultsTable results={g.results} />
            </section>
          ))}
          {(!run.groups || run.groups.length === 0) && <EmptyState title="This run has no provider groups" />}
        </div>
      )}
    </Modal>
  );
}

export function ScheduledJobsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { runs, loading, error, loadedAt, reload } = useJobRuns({ refreshMs: autoRefresh ? REFRESH_MS : null });
  const [openRunId, setOpenRunId] = useState(null);
  const latest = runs[0];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Scheduled jobs</h1>
          <p className="muted">Runs of the backend's scheduled SMS job, newest first.</p>
        </div>
        <div className="toolbar toolbar-center">
          <label className="checkbox">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh every {REFRESH_MS / 1000} s
          </label>
          <button type="button" className="btn" onClick={reload} disabled={loading}>
            {loading && <Spinner small />} Refresh
          </button>
        </div>
      </header>

      <Alert tone="info">
        The backend runs this job on its own schedule and sends to the recipients in its targets file, which an
        independent system keeps up to date. This page only shows the results; it cannot start, change or stop a job.
      </Alert>

      <ErrorAlert error={error} />

      {latest && (
        <div className="stats">
          <Stat label="Last run" value={formatDateTime(latest.startedAt)} size="sm" />
          <Stat label="Last run status" value={<StatusBadge status={latest.status} />} size="sm" />
          <Stat label="Accepted (last run)" value={`${latest.accepted} / ${latest.total}`} tone="success" />
          <Stat label="Failed (last run)" value={latest.failed} tone={latest.failed ? 'error' : undefined} />
        </div>
      )}

      {loading && runs.length === 0 && <LoadingState label="Loading job runs..." />}
      {!loading && !error && runs.length === 0 && (
        <EmptyState title="No job runs yet">Runs appear here after the backend scheduler has run the job.</EmptyState>
      )}

      {runs.length > 0 && (
        <div className="card table-card">
          <table className="table responsive-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Providers</th>
                <th>Targets version</th>
                <th>Duration</th>
                <th className="actions-col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.runId}>
                  <td data-label="Started" title={run.startedAt}>
                    {formatDateTime(run.startedAt)}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={run.status} />
                  </td>
                  <td data-label="Recipients">
                    {run.accepted} of {run.total} accepted
                    {run.failed > 0 && <span className="text-error"> · {run.failed} failed</span>}
                  </td>
                  <td data-label="Providers">
                    <GroupChips groups={run.groups} />
                  </td>
                  <td data-label="Targets version">
                    <code>{run.targetsVersion || 'unknown'}</code>
                  </td>
                  <td data-label="Duration">{formatDuration(run.startedAt, run.finishedAt) ?? 'Running'}</td>
                  <td data-label="Actions" className="actions-col">
                    <button type="button" className="btn btn-sm" onClick={() => setOpenRunId(run.runId)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadedAt && (
        <p className="hint">
          Updated {loadedAt.toLocaleTimeString()} <SimulatedBadge />
        </p>
      )}

      {openRunId && <JobRunModal runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </section>
  );
}
