import { CircleAlertIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enter } from '@/lib/motion';
import { errorHelp } from '../utils/errors.js';

// Shows an ApiError: title, status and code, detail, validation problems,
// provider error code and a plain-language explanation of the code.
export function ErrorAlert({ error, onDismiss }) {
  if (!error) return null;
  const help = errorHelp(error);
  const meta = [error.status ? `HTTP ${error.status}` : null, error.code].filter(Boolean).join(' · ');

  return (
    <div
      role="alert"
      className={`relative flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-4 text-sm ${enter}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <CircleAlertIcon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5 pe-6">
        <p className="font-semibold">{error.title || 'Something went wrong'}</p>
        {meta && <p className="tabular-nums text-destructive text-xs">{meta}</p>}
        {error.detail && <p>{error.detail}</p>}
        {!error.detail && !error.title && error.message && <p>{error.message}</p>}
        {error.providerErrorCode && (
          <p className="text-muted-foreground">
            Provider error code: <code className="text-foreground">{error.providerErrorCode}</code>
          </p>
        )}
        {error.problems?.length > 0 && (
          <ul className="list-disc space-y-0.5 ps-4">
            {error.problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
        {help && <p className="text-muted-foreground">{help}</p>}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute end-2 top-2 rounded-full"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <XIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
