import { config } from '../config.js';

export function Badge({ tone = 'neutral', children, title }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

// Shown next to any result produced by the mock API.
export function SimulatedBadge() {
  if (!config.useMockApi) return null;
  return (
    <Badge tone="sim" title="Produced by the mock API. No real request was made.">
      Simulated
    </Badge>
  );
}
