import { Label } from '@/components/ui/label';

// Label, control, then either the error (red) or the description (muted).
// `aside` renders on the label row, for example a template picker or a counter.
export function FormField({ id, label, aside, description, error, footerEnd, children }) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <Label htmlFor={id} className="font-semibold text-sm">
          {label}
        </Label>
        {aside}
      </div>
      {children}
      {(error || description || footerEnd) && (
        <div className="flex items-start justify-between gap-3 text-xs">
          {error ? (
            <p id={`${id}-error`} className="font-medium text-destructive">
              {error}
            </p>
          ) : (
            <p id={`${id}-description`} className="text-muted-foreground">
              {description}
            </p>
          )}
          {footerEnd}
        </div>
      )}
    </div>
  );
}

// Shared sizing for text inputs and select triggers across forms.
export const controlClass = 'h-10 rounded-xl bg-background/60 px-3 text-sm shadow-xs';
