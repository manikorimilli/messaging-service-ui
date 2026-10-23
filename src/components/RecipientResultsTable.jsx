import { ERROR_HELP } from '../utils/errors.js';
import { Badge } from './Badge.jsx';
import { EmptyState } from './States.jsx';

// Per-recipient outcome table, shared by bulk sends and scheduled job runs.
// Expects camelCase fields: to, status, providerMessageId, providerStatus,
// code, providerErrorCode, detail.
export function RecipientResultsTable({ results }) {
  if (!Array.isArray(results) || results.length === 0) {
    return <EmptyState title="No per-recipient results returned" />;
  }

  return (
    <div className="table-card">
      <table className="table responsive-table">
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Status</th>
            <th>Message ID</th>
            <th>Provider status</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const failed = r.status !== 'ACCEPTED';
            return (
              <tr key={`${r.to}-${i}`} className={failed ? 'row-failed' : undefined}>
                <td data-label="Recipient">
                  <code>{r.to}</code>
                </td>
                <td data-label="Status">
                  {failed ? <Badge tone="error">{r.status || 'FAILED'}</Badge> : <Badge tone="success">Accepted</Badge>}
                </td>
                <td data-label="Message ID">
                  {r.providerMessageId ? <code className="break">{r.providerMessageId}</code> : <span className="muted">none</span>}
                </td>
                <td data-label="Provider status">{r.providerStatus ?? <span className="muted">none</span>}</td>
                <td data-label="Error">
                  {failed ? (
                    <div className="error-cell">
                      {r.code && <code>{r.code}</code>}
                      {r.providerErrorCode && <span>Provider code {r.providerErrorCode}</span>}
                      {r.detail && <span>{r.detail}</span>}
                      {r.code && ERROR_HELP[r.code] && <span className="hint">{ERROR_HELP[r.code]}</span>}
                    </div>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
