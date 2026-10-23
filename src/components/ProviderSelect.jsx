import { providerLabel, supportsSms } from '../utils/providerConfig.js';

// "" means "use the primary provider"; the request then omits `provider`.
export function ProviderSelect({ id, value, onChange, providers, loading, error, disabled }) {
  const smsProviders = providers.filter(supportsSms);

  let hint = 'The server picks its primary provider. The request leaves out "provider".';
  if (value) hint = `Request will include "provider": "${value}".`;
  if (loading && providers.length === 0) hint = 'Loading providers...';
  if (error) hint = 'Could not load providers. You can still send with the primary provider.';

  return (
    <div className="field">
      <label htmlFor={id}>Provider</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Use primary provider</option>
        {smsProviders.map((p) => (
          <option key={p.id} value={p.id} disabled={!p.enabled}>
            {providerLabel(p)}
            {p.enabled ? '' : ' (disabled)'}
          </option>
        ))}
      </select>
      <p className="hint">{hint}</p>
    </div>
  );
}
