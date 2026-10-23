import { LockIcon } from 'lucide-react';
import { isReadOnly } from '../utils/providerConfig.js';
import { CodeWindow } from './CodeWindow.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function EnabledBadge({ enabled }) {
  return enabled ? (
    <StatusBadge tone="success" dot>
      Enabled
    </StatusBadge>
  ) : (
    <StatusBadge dot>Disabled</StatusBadge>
  );
}

export function SourceBadge({ provider }) {
  return isReadOnly(provider) ? (
    <StatusBadge title="Built-in provider from providers.json. View only.">
      <LockIcon aria-hidden="true" />
      {provider.source || 'providers.json'}
    </StatusBadge>
  ) : (
    <StatusBadge tone="info" title="Added through the API. Can be edited.">
      {provider.source || 'db.json'}
    </StatusBadge>
  );
}

export function ChannelBadges({ channels }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(channels || []).map((c) => (
        <StatusBadge key={c} className="h-5 px-2">
          {c}
        </StatusBadge>
      ))}
    </span>
  );
}

function Detail({ label, children }) {
  return (
    <div className="space-y-1.5">
      <dt className="font-medium text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function ProviderDetails({ provider }) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
        <Detail label="ID">
          <code>{provider.id}</code>
        </Detail>
        <Detail label="Display name">{provider['display-name']}</Detail>
        <Detail label="Channels">
          <ChannelBadges channels={provider.channels} />
        </Detail>
        <Detail label="Status">
          <EnabledBadge enabled={provider.enabled} />
        </Detail>
        <Detail label="Source">
          <SourceBadge provider={provider} />
        </Detail>
      </dl>
      {isReadOnly(provider) && (
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <LockIcon className="size-4" aria-hidden="true" />
          Built-in providers are defined on the server and can only be viewed here.
        </p>
      )}
      <CodeWindow title={`${provider.id}.json`}>
        <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed">{JSON.stringify(provider, null, 2)}</pre>
      </CodeWindow>
      <p className="text-muted-foreground text-xs">Secret values are masked by the server.</p>
    </div>
  );
}
