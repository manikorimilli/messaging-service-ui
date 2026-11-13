import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { providerLabel, supportsSms } from '../utils/providerConfig.js';
import { FormField, controlClass } from './FormField.jsx';
import { StatusBadge } from './StatusBadge.jsx';

// A provider must be chosen: its config decides which uaap parameters the send
// fills. `error` is a load failure; `invalid` is the "choose one" message.
export function ProviderSelect({ id, value, onChange, providers, loading, error, invalid, onBlur, disabled }) {
  const smsProviders = providers.filter(supportsSms);

  let hint = 'Choose the provider that sends this message.';
  if (loading && providers.length === 0) hint = 'Loading providers...';
  if (error) hint = 'Could not load providers. Refresh to try again.';

  return (
    <FormField id={id} label="Provider" description={hint} error={invalid}>
      <Select value={value} onValueChange={onChange} onOpenChange={(open) => !open && onBlur?.()} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn(controlClass, 'w-full data-[size=default]:h-10')}
          aria-invalid={Boolean(invalid) || undefined}
          aria-describedby={invalid ? `${id}-error` : `${id}-description`}
        >
          <SelectValue placeholder="Choose a provider" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl">
          {smsProviders.length === 0 && (
            <SelectItem value="__none__" disabled>
              No SMS providers
            </SelectItem>
          )}
          {smsProviders.map((p) => (
            <SelectItem key={p.id} value={p.id} disabled={!p.enabled}>
              {providerLabel(p)}
              {!p.enabled && <StatusBadge className="h-5">Disabled</StatusBadge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
