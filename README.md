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

All settings live in one file, `.env` in the project root. It is ignored by git, so each developer keeps
their own. Create it if it does not exist, and restart `npm run dev` after any change.

| Variable | Default (no `.env`) | Meaning |
|---|---|---|
| `VITE_USE_MOCK_API` | `true` | Mock mode stays on unless this is exactly `false`. |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend base URL, no trailing slash. Empty means same origin (the dev proxy). |
| `DEV_PROXY_TARGET` | unset | Dev server only. Forwards `/api/*` to this URL. |

Neither the local nor the Azure backend sends CORS headers, so a page on `localhost:5180` cannot call them
directly. Leave `VITE_API_BASE_URL` empty and set `DEV_PROXY_TARGET` instead; the Vite dev server forwards
the requests. Keep exactly one `DEV_PROXY_TARGET` line active:

```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=

# Local backend:
# DEV_PROXY_TARGET=http://localhost:8080
# Deployed backend (Azure):
DEV_PROXY_TARGET=https://messagin-service-gshecfhwaubth6fk.centralindia-01.azurewebsites.net
```

The proxy exists only in `npm run dev`. For a production build, set `VITE_API_BASE_URL` to the backend URL
before `npm run build`, and either enable CORS on the backend for the frontend's origin or serve both from
the same origin behind a reverse proxy.

The header shows which mode is active ("Mock API" or "Live: ...").

Backend API docs: `{baseURL}/swagger-ui.html` and `{baseURL}/v3/api-docs`.

## Deploying to Vercel

`vercel.json` builds the app and forwards `/api/*` to the Azure backend, so the browser only talks to Vercel
and the backend needs no CORS setup (this mirrors the dev proxy).

1. Push the repository to GitHub, then in Vercel: **Add New** > **Project** > import this repository.
   The framework, build command and output folder come from `vercel.json`.
2. Under **Environment Variables**, add `VITE_USE_MOCK_API` = `false` and `VITE_API_BASE_URL` = `/`.
   `.env` is not in git, so without these the deployed app falls back to mock mode.
3. **Deploy**. Every push to the main branch redeploys. After changing an environment variable, redeploy.

To point the deployed app at a different backend, change the `destination` in `vercel.json`.

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
