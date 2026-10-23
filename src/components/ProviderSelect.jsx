import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { providerLabel, supportsSms } from '../utils/providerConfig.js';
import { FormField, controlClass } from './FormField.jsx';
import { StatusBadge } from './StatusBadge.jsx';

// Radix Select items cannot use "" as a value, so the primary provider has a sentinel.
const PRIMARY = '__primary__';

// "" means "use the primary provider"; the request then omits `provider`.
export function ProviderSelect({ id, value, onChange, providers, loading, error, disabled }) {
  const smsProviders = providers.filter(supportsSms);

  let hint = 'The server picks its primary provider. The request leaves out "provider".';
  if (value) hint = `The request will include "provider": "${value}".`;
  if (loading && providers.length === 0) hint = 'Loading providers...';
  if (error) hint = 'Could not load providers. You can still send with the primary provider.';

  return (
    <FormField id={id} label="Provider" description={hint}>
      <Select value={value || PRIMARY} onValueChange={(next) => onChange(next === PRIMARY ? '' : next)} disabled={disabled}>
        <SelectTrigger id={id} className={cn(controlClass, 'w-full data-[size=default]:h-10')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl">
          <SelectItem value={PRIMARY}>Use primary provider</SelectItem>
          {smsProviders.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Providers</SelectLabel>
                {smsProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={!p.enabled}>
                    {providerLabel(p)}
                    {!p.enabled && <StatusBadge className="h-5">Disabled</StatusBadge>}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </FormField>
  );
}
