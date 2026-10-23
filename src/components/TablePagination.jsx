import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PAGE_SIZES = [5, 10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;

// Page numbers to show: first, last, and the current page with its neighbours;
// gaps become an ellipsis. Example for page 5 of 9: 1 … 4 5 6 … 9
export function pageList(page, pageCount) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p);
    out.push(p);
  });
  return out;
}

// Client-side pagination controls for a table. `page` is 1-based.
export function TablePagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange, label = 'rows' }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="tabular-nums" aria-live="polite">
          Showing {from}-{to} of {total} {label}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger size="sm" className="w-auto rounded-full" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            </PaginationItem>
            {pageList(page, pageCount).map((p) =>
              typeof p === 'string' ? (
                <PaginationItem key={p}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <Button
                    variant={p === page ? 'outline' : 'ghost'}
                    size="icon-sm"
                    className="rounded-full tabular-nums"
                    onClick={() => onPageChange(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </Button>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount}
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
