import { FlaskConicalIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { config } from '../config.js';

// Shown next to any result produced by the mock API.
export function SimulatedBadge() {
  if (!config.useMockApi) return null;
  return (
    <Badge variant="info" title="Produced by the mock API. No real request was made.">
      <FlaskConicalIcon aria-hidden="true" />
      Simulated
    </Badge>
  );
}
