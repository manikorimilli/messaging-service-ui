import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ERROR_HELP } from '../utils/errors.js';
import { EmptyState } from './States.jsx';

const none = <span className="text-muted-foreground">none</span>;

// Per-recipient outcome table, shared by bulk sends and scheduled job runs.
// Expects camelCase fields: to, status, providerMessageId, providerStatus,
// code, providerErrorCode, detail.
export function RecipientResultsTable({ results }) {
  if (!Array.isArray(results) || results.length === 0) {
    return <EmptyState title="No per-recipient results returned" />;
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message ID</TableHead>
            <TableHead>Provider status</TableHead>
            <TableHead className="min-w-64">Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r, i) => {
            const failed = r.status !== 'ACCEPTED';
            return (
              <TableRow key={`${r.to}-${i}`} className={failed ? 'bg-destructive/4' : undefined}>
                <TableCell className="font-mono">{r.to}</TableCell>
                <TableCell>
                  {failed ? (
                    <Badge variant="error">
                      <CircleXIcon aria-hidden="true" />
                      {r.status || 'FAILED'}
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      <CircleCheckIcon aria-hidden="true" />
                      Accepted
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-56 truncate font-mono text-xs" title={r.providerMessageId || undefined}>
                  {r.providerMessageId || none}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.providerStatus ?? none}</TableCell>
                <TableCell className="whitespace-normal">
                  {failed ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {r.code && <code className="font-mono font-medium text-destructive-foreground">{r.code}</code>}
                        {r.providerErrorCode && (
                          <Badge variant="outline" size="sm" className="font-mono">
                            {r.providerErrorCode}
                          </Badge>
                        )}
                      </span>
                      {r.detail && <span className="text-foreground">{r.detail}</span>}
                      {r.code && ERROR_HELP[r.code] && <span className="text-muted-foreground">{ERROR_HELP[r.code]}</span>}
                    </div>
                  ) : (
                    none
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
