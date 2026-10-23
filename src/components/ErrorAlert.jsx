import { CircleAlertIcon, XIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorHelp } from '../utils/errors.js';

// Shows an ApiError: title, status and code, detail, validation problems,
// provider error code and a plain-language explanation of the code.
export function ErrorAlert({ error, onDismiss }) {
  if (!error) return null;
  const help = errorHelp(error);
  const meta = [error.status ? `HTTP ${error.status}` : null, error.code].filter(Boolean).join(' · ');

  return (
    <Alert variant="error" role="alert">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{error.title || 'Something went wrong'}</AlertTitle>
      <AlertDescription className="space-y-1.5">
        {meta && <p className="font-mono text-xs">{meta}</p>}
        {error.detail && <p className="text-foreground">{error.detail}</p>}
        {!error.detail && !error.title && error.message && <p className="text-foreground">{error.message}</p>}
        {error.providerErrorCode && (
          <p>
            Provider error code: <code className="font-mono">{error.providerErrorCode}</code>
          </p>
        )}
        {error.problems?.length > 0 && (
          <ul className="list-disc space-y-0.5 ps-4 text-foreground">
            {error.problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
        {help && <p>{help}</p>}
      </AlertDescription>
      {onDismiss && (
        <AlertAction>
          <Button variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Dismiss error">
            <XIcon aria-hidden="true" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
