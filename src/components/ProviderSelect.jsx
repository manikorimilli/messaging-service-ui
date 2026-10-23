import { Badge } from '@/components/ui/badge';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { providerLabel, supportsSms } from '../utils/providerConfig.js';

const PRIMARY = { label: 'Use primary provider', value: null };

// "" means "use the primary provider"; the request then omits `provider`.
export function ProviderSelect({ id, value, onChange, providers, loading, error, disabled }) {
  const smsProviders = providers.filter(supportsSms);
  const items = [PRIMARY, ...smsProviders.map((p) => ({ label: providerLabel(p), value: p.id }))];

  let hint = 'The server picks its primary provider. The request leaves out "provider".';
  if (value) hint = `The request will include "provider": "${value}".`;
  if (loading && providers.length === 0) hint = 'Loading providers...';
  if (error) hint = 'Could not load providers. You can still send with the primary provider.';

  return (
    <Field>
      <FieldLabel>Provider</FieldLabel>
      <Select items={items} value={value || null} onValueChange={(next) => onChange(next ?? '')} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value={null}>{PRIMARY.label}</SelectItem>
          {smsProviders.map((p) => (
            <SelectItem key={p.id} value={p.id} disabled={!p.enabled}>
              <span className="flex items-center gap-2">
                {providerLabel(p)}
                {!p.enabled && (
                  <Badge variant="secondary" size="sm">
                    Disabled
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <FieldDescription>{hint}</FieldDescription>
    </Field>
  );
}
