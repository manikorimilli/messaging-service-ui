import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import audience from '../data/target_audiance.sample.json';
import { ALL_TEMPLATES } from '../data/sampleTemplates.js';
import { formatDateTime } from '../utils/format.js';

const PRIMARY = 'Primary provider';
const templateById = Object.fromEntries(ALL_TEMPLATES.map((t) => [t.id, t]));

// Group the sample rows by provider, then by message template.
function groupAudience(rows) {
  const byProvider = new Map();
  for (const row of rows) {
    const providerKey = row.provider || PRIMARY;
    if (!byProvider.has(providerKey)) byProvider.set(providerKey, new Map());
    const byTemplate = byProvider.get(providerKey);
    if (!byTemplate.has(row.template)) byTemplate.set(row.template, { template: row.template, rows: [], times: new Set() });
    const group = byTemplate.get(row.template);
    group.rows.push(row);
    group.times.add(row.scheduledAt);
  }
  return [...byProvider].map(([provider, templates]) => ({ provider, jobs: [...templates.values()] }));
}

const GROUPS = groupAudience(audience);
const JOB_COUNT = GROUPS.reduce((n, g) => n + g.jobs.length, 0);
const NEXT_RUN = [...new Set(audience.map((r) => r.scheduledAt))]
  .filter((t) => new Date(t).getTime() > Date.now())
  .sort()[0];

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// Read-only demo. Scheduling and file processing belong to the backend, and
// there is no scheduling endpoint, so this page never sends or schedules anything.
export function ScheduledJobsPage() {
  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>
            Scheduled jobs <Badge tone="sim">Demo · sample data</Badge>
          </h1>
          <p className="muted">Planned SMS jobs, grouped by provider and message template.</p>
        </div>
      </header>

      <Alert tone="info">
        This is a read-only preview built from a sample <code>target_audiance.json</code> bundled with this app.
        Scheduling and file processing run on the backend, and an independent system updates the real file. There is
        no scheduling endpoint yet, so nothing on this page is sent or scheduled.
      </Alert>

      <div className="stats">
        <Stat label="Jobs" value={JOB_COUNT} />
        <Stat label="Recipients" value={audience.length} />
        <Stat label="Providers" value={GROUPS.length} />
        <Stat label="Next run" value={NEXT_RUN ? formatDateTime(NEXT_RUN) : 'None upcoming'} />
      </div>

      <div className="demo-groups">
        {GROUPS.map(({ provider, jobs }) => (
          <section key={provider} className="card demo-group">
            <h2>
              {provider === PRIMARY ? PRIMARY : <code>{provider}</code>}
              <span className="muted"> · {jobs.reduce((n, j) => n + j.rows.length, 0)} recipients</span>
            </h2>
            {jobs.map((job) => (
              <div key={job.template} className="demo-job">
                <div className="demo-job-head">
                  <strong>{templateById[job.template]?.name || job.template}</strong>
                  <Badge tone="neutral">{job.rows.length} recipients</Badge>
                </div>
                <p className="demo-message">{templateById[job.template]?.text || 'Template text not in sample.'}</p>
                <p className="hint">Scheduled: {[...job.times].map(formatDateTime).join(', ')}</p>
                <details>
                  <summary>Recipients</summary>
                  <ul className="recipient-list">
                    {job.rows.map((r) => (
                      <li key={r.phone}>
                        {r.name} <code>{r.phone}</code>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
