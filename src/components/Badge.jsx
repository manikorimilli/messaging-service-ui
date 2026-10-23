import { FlaskConicalIcon } from 'lucide-react';
import { config } from '../config.js';
import { StatusBadge } from './StatusBadge.jsx';

// Shown next to any result produced by the mock API.
export function SimulatedBadge() {
  if (!config.useMockApi) return null;
  return (
    <StatusBadge tone="info" title="Produced by the mock API. No real request was made.">
      <FlaskConicalIcon aria-hidden="true" />
      Simulated
    </StatusBadge>
  );
}
