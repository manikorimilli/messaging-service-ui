# Messaging Console

A small React frontend for the multi-provider notification service. It covers:

- **Providers**: list, view, register (paste or upload JSON), edit, enable, disable and unregister providers.
- **Send SMS**: one message to one recipient.
- **Bulk SMS**: one message to up to 100 recipients, with per-recipient results.
- **Scheduled jobs**: results of the backend's scheduled SMS job (`GET /api/v1/job-runs`), with per-recipient
  details for each run (`GET /api/v1/job-runs/{runId}`).

The backend supports SMS only. Email, Call and WhatsApp appear in the navigation as "soon" and do nothing yet.

Built with React 19, Vite and plain CSS. No router, state library or UI kit.

## Setup

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The app starts in **mock mode**: providers and send
results are simulated in the browser, and every simulated result carries a purple "Simulated" badge.

Other scripts:

```bash
npm test          # unit tests (validation, request building, HTTP client, mock backend)
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Switching to the real backend

Configuration comes from Vite environment variables. Copy `.env.example` to `.env.local`, edit it, and restart
`npm run dev`.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK_API` | `true` | Mock mode stays on unless this is exactly `false`. |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend base URL, no trailing slash. Empty means same origin. |
| `DEV_PROXY_TARGET` | unset | Dev server only. Forwards `/api/*` to this URL. |

**Local backend** (`http://localhost:8080`):

```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8080
```

**Azure backend.** The Azure service does not currently send CORS headers, so a browser page on
`localhost` cannot call it directly. Use the dev proxy instead: leave the base URL empty so requests go to
the Vite server, which forwards them.

```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=
DEV_PROXY_TARGET=https://messagin-service-gshecfhwaubth6fk.centralindia-01.azurewebsites.net
```

The same applies to a local backend that rejects cross-origin requests: point `DEV_PROXY_TARGET` at it.
For a deployed build, either enable CORS on the backend for the frontend's origin or serve both from the same
origin behind a reverse proxy.

The header shows which mode is active ("Mock API" or "Live: ...").

Backend API docs: `{baseURL}/swagger-ui.html` and `{baseURL}/v3/api-docs`.

## Mock mode

The mock API (`src/api/mockApi.js`) follows the backend contract: case-insensitive IDs stored in uppercase,
masked secrets, read-only built-ins, `****` preserving stored secrets on update, duplicate removal in batches,
and the same error codes. Its state lives in memory, so reloading the page resets it.

Sample providers: `TWILIO` and `VONAGE` (built-in, read-only), `MSG91` (editable, but referenced in routing so
it cannot be deleted), and `TEXTLOCAL` (editable, starts disabled). With no provider selected, the mock uses
`TWILIO` as the primary provider.

Test numbers:

| Number ends in | Result |
|---|---|
| `000` | Provider rejects it: `PROVIDER_REJECTED` (502), provider code `21211` |
| `999` | Provider times out: `PROVIDER_TIMEOUT` (504) |
| anything else | Accepted |

Sending with a disabled provider returns `PROVIDER_UNAVAILABLE` (503).

## Project layout

```
src/
  config.js                 mock flag, base URL, timeout
  api/
    index.js                the only module pages use; builds request bodies, picks mock or real
    realApi.js              one function per backend endpoint
    httpClient.js           fetch wrapper: JSON, 204 handling, problem responses, network errors
    ApiError.js             error type shown by the UI
    mockApi.js, mockData.js in-memory backend for development and tests
  pages/                    ProvidersPage, SendSmsPage, BulkSmsPage, ScheduledJobsPage
  components/               reusable UI: alerts, modal, confirm dialog, provider select, JSON form...
  hooks/                    useProviders, useAsyncAction (blocks duplicate submits)
  utils/                    validation rules, provider config helpers, error explanations
  data/                     frontend-only sample templates
```

## Behaviour notes

- **Primary provider.** Choosing "Use primary provider" leaves `provider` out of the request body.
- **Accepted is not delivered.** Results say "Accepted by provider", meaning the provider queued the message.
- **Bulk recipients** are added as chips: type a number and press Enter (a comma, or pasting a list, also
  works). Remove one with its ×, or press Backspace in the empty box to remove the last. Invalid numbers stay in
  the box with a message, duplicates are skipped, and a number typed but not yet added is included when you
  press Send. A `200` response can still contain failed recipients; the page shows "Partially accepted" and
  lists each error. Resend only the failed numbers.
- **Provider updates** always send the full configuration, without `source` and `read-only`. Masked values
  (`****`) are sent back unchanged so the server keeps the stored secret. Enable and disable fetch the
  provider, flip `enabled`, and send the full configuration the same way.
- **Read-only providers** (`"read-only": true`, from `providers.json`) only offer View.
- **Unregister** asks for confirmation. `PROVIDER_IN_USE` means the provider is referenced in server routing
  and must be removed from routing on the server before it can be deleted.
- **Templates** on the send pages are frontend-only and fill the message box; the final text is sent as `body`.
  With Twilio or the primary provider selected, the list shows the Twilio test values (`sms_2fa`,
  `sms_appointment_reminders`, ...), which are the only bodies Twilio accepts. Vonage and other providers get
  free-text samples. Both lists live in `src/data/sampleTemplates.js`.
- **Scheduled jobs** lists runs of the backend's scheduled job, newest first, and refreshes every 30 seconds
  while the toggle is on. **Details** opens one run with each provider's per-recipient results. The page is
  read-only: the backend owns the schedule and its targets file, and the API has no way to start or change a
  job. Job-run responses use kebab-case keys (`run-id`, `provider-error-code`); the API layer converts them to
  camelCase. In mock mode the page shows three sample runs.
- **Credentials** are never written to browser storage or logged. Provider JSON lives only in component state
  while a form is open.
