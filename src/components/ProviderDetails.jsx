import { LockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isReadOnly } from '../utils/providerConfig.js';

export function EnabledBadge({ enabled }) {
  return enabled ? (
    <Badge variant="success">
      <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
      Enabled
    </Badge>
  ) : (
    <Badge variant="secondary">
      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
      Disabled
    </Badge>
  );
}

export function SourceBadge({ provider }) {
  return isReadOnly(provider) ? (
    <Badge variant="outline" title="Built-in provider from providers.json. View only.">
      <LockIcon aria-hidden="true" />
      {provider.source || 'providers.json'}
    </Badge>
  ) : (
    <Badge variant="info" title="Added through the API. Can be edited.">
      {provider.source || 'db.json'}
    </Badge>
  );
}

export function ChannelBadges({ channels }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(channels || []).map((c) => (
        <Badge key={c} variant="outline" className="font-mono">
          {c}
        </Badge>
      ))}
    </span>
  );
}

function Detail({ label, children }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function ProviderDetails({ provider }) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-3">
        <Detail label="ID">
          <code className="font-mono">{provider.id}</code>
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
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Configuration</h3>
        <pre className="max-h-96 overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
          {JSON.stringify(provider, null, 2)}
        </pre>
        <p className="text-muted-foreground text-xs">Secret values are masked by the server.</p>
      </div>
    </div>
  );
}
