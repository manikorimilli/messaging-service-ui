import { config } from '../config.js';

// Tells testers how to trigger each simulated outcome. Hidden when using the real backend.
export function MockHints() {
  if (!config.useMockApi) return null;
  return (
    <details className="card mock-hints">
      <summary>Mock mode test numbers</summary>
      <ul>
        <li>
          Ending in <code>000</code>: provider rejects the number (<code>PROVIDER_REJECTED</code>, code 21211)
        </li>
        <li>
          Ending in <code>999</code>: provider times out (<code>PROVIDER_TIMEOUT</code>)
        </li>
        <li>Any other valid number: accepted</li>
        <li>
          Textlocal starts disabled, so sending with it returns <code>PROVIDER_UNAVAILABLE</code> until you enable it.
        </li>
      </ul>
    </details>
  );
}
