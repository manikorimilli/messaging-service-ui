import { ChevronDownIcon, FlaskConicalIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';
import { config } from '../config.js';

// Tells testers how to trigger each simulated outcome. Hidden when using the real backend.
export function MockHints() {
  if (!config.useMockApi) return null;
  return (
    <Card className="p-0">
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <FlaskConicalIcon className="size-4 text-info" aria-hidden="true" />
          Mock mode test numbers
          <ChevronDownIcon
            className="ms-auto size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-180"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ul className="space-y-1.5 px-4 pb-4 text-muted-foreground text-sm">
            <li>
              Ending in <code className="font-mono text-foreground">000</code>: provider rejects the number
              (PROVIDER_REJECTED, code 21211)
            </li>
            <li>
              Ending in <code className="font-mono text-foreground">999</code>: provider times out (PROVIDER_TIMEOUT)
            </li>
            <li>Any other valid number: accepted</li>
            <li>Textlocal starts disabled, so sending with it returns PROVIDER_UNAVAILABLE until you enable it.</li>
          </ul>
        </CollapsiblePanel>
      </Collapsible>
    </Card>
  );
}
