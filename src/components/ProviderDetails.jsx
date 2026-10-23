import { isReadOnly } from '../utils/providerConfig.js';
import { Badge } from './Badge.jsx';

export function EnabledBadge({ enabled }) {
  return enabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="muted">Disabled</Badge>;
}

export function SourceBadge({ provider }) {
  return isReadOnly(provider) ? (
    <Badge tone="neutral" title="Built-in provider from providers.json. View only.">
      {provider.source || 'providers.json'} · read-only
    </Badge>
  ) : (
    <Badge tone="info" title="Added through the API. Can be edited.">
      {provider.source || 'db.json'}
    </Badge>
  );
}

export function ProviderDetails({ provider }) {
  return (
    <div className="stack">
      <dl className="details">
        <div>
          <dt>ID</dt>
          <dd>
            <code>{provider.id}</code>
          </dd>
        </div>
        <div>
          <dt>Display name</dt>
          <dd>{provider['display-name']}</dd>
        </div>
        <div>
          <dt>Channels</dt>
          <dd>{(provider.channels || []).join(', ')}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <EnabledBadge enabled={provider.enabled} />
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            <SourceBadge provider={provider} />
          </dd>
        </div>
      </dl>
      {isReadOnly(provider) && (
        <p className="muted">Built-in providers are defined on the server and can only be viewed here.</p>
      )}
      <div>
        <h3 className="section-label">Configuration</h3>
        <pre className="code-block">{JSON.stringify(provider, null, 2)}</pre>
        <p className="hint">Secret values are masked by the server.</p>
      </div>
    </div>
  );
}
