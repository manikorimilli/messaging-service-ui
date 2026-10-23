import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ERROR_HELP } from '../utils/errors.js';
import { EmptyState } from './States.jsx';
import { StatusBadge } from './StatusBadge.jsx';

const none = <span className="text-muted-foreground">none</span>;

// Per-recipient outcome table, shared by bulk sends and scheduled job runs.
// Expects camelCase fields: to, status, providerMessageId, providerStatus,
// code, providerErrorCode, detail.
export function RecipientResultsTable({ results }) {
  if (!Array.isArray(results) || results.length === 0) {
    return <EmptyState title="No per-recipient results returned" />;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background/40">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="ps-4">Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message ID</TableHead>
            <TableHead>Provider status</TableHead>
            <TableHead className="min-w-64 pe-4">Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r, i) => {
            const failed = r.status !== 'ACCEPTED';
            return (
              <TableRow key={`${r.to}-${i}`} className={failed ? 'bg-destructive/5 hover:bg-destructive/8' : undefined}>
                <TableCell className="ps-4 tabular-nums">{r.to}</TableCell>
                <TableCell>
                  {failed ? (
                    <StatusBadge tone="error">
                      <CircleXIcon aria-hidden="true" />
                      {r.status || 'FAILED'}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success">
                      <CircleCheckIcon aria-hidden="true" />
                      Accepted
                    </StatusBadge>
                  )}
                </TableCell>
                <TableCell className="max-w-56 truncate tabular-nums text-xs" title={r.providerMessageId || undefined}>
                  {r.providerMessageId || none}
                </TableCell>
                <TableCell className="tabular-nums text-xs">{r.providerStatus ?? none}</TableCell>
                <TableCell className="whitespace-normal pe-4">
                  {failed ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {r.code && <code className="font-semibold text-destructive">{r.code}</code>}
                        {r.providerErrorCode && (
                          <StatusBadge className="h-5 px-1.5">
                            {r.providerErrorCode}
                          </StatusBadge>
                        )}
                      </span>
                      {r.detail && <span>{r.detail}</span>}
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
