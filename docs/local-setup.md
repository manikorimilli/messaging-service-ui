# Local Setup

Runs the Messaging Console, the web frontend of the messaging service, on your machine: with
simulated data (mock mode, no backend needed) or against a real backend.

Node 22.12 or newer, npm. React 19, Vite 8.

## Install

```bash
git clone https://github.com/manikorimilli/messaging-service-ui.git
cd messaging-service-ui
npm install
```

## Configure

Settings come from a local `.env` file:

```bash
cp .env.example .env
```

Use the values as they are. The frontend has no secrets: the values in `.env.example` are the
real settings, and no separate `.env` values are sent to you. `.env` is git-ignored; restart
`npm run dev` after every change.

| Variable | Used for |
|---|---|
| `VITE_USE_MOCK_API` | `true`: simulated data in the browser. `false`: call the real backend. Anything but exactly `false` means mock mode. |
| `DEV_PROXY_TARGET` | Backend that `npm run dev` forwards `/api/*` to. Read only by the dev server, never sent to the browser. |

The backend sends no CORS headers, so the browser cannot call it directly from `localhost`. The app
sends every request to its own address, and the dev proxy forwards it to `DEV_PROXY_TARGET`.

## Run

### Mock mode

Keep `VITE_USE_MOCK_API=true` and start the app:

```bash
npm run dev
```

Open `http://localhost:5173`. The sidebar shows **Mock mode**. Data lives in the browser and resets
on reload.

### Local backend

Start the backend first (`./mvnw spring-boot:run` in `messaging-service`, listens on
`http://localhost:8080`). Then set in `.env`:

```
VITE_USE_MOCK_API=false
DEV_PROXY_TARGET=http://localhost:8080
```

```bash
npm run dev
```

The sidebar shows a green **Live** badge.

### Deployed backend (Azure)

Same as above, with the Azure line active instead:

```
DEV_PROXY_TARGET=https://messagin-service-gshecfhwaubth6fk.centralindia-01.azurewebsites.net
```

## Pages

| Address | Page |
|---|---|
| `/#/providers` | Providers (the start page) |
| `/#/send` | Send SMS |
| `/#/bulk` | Bulk SMS |
| `/#/scheduled` | Scheduled jobs |
| `/overview` | Overview. Not in the menu: open it from the logo or by typing the address. |

## Mock test numbers

| Number ends in | Result |
|---|---|
| `000` | Rejected: `PROVIDER_REJECTED` (502) |
| `999` | Timed out: `PROVIDER_TIMEOUT` (504) |
| anything else | Accepted |

## Tests

```bash
npm test
```

```bash
npm run build
npm run preview
```

`npm run build` writes the production build to `dist/`; `npm run preview` serves it.

## Troubleshooting

| Problem | Fix |
|---|---|
| Sidebar still says Mock mode | Set `VITE_USE_MOCK_API=false` exactly, then restart `npm run dev`. |
| Every request fails with a network or CORS error | Set `DEV_PROXY_TARGET`, delete any `VITE_API_BASE_URL` line from `.env`, and restart `npm run dev`. |
| Terminal shows `http proxy error` / `ECONNREFUSED` | The backend is not running at `DEV_PROXY_TARGET`. Start it, or switch to the Azure line. |
| Port 5173 already in use | Vite picks the next free port. Open the URL it prints. |
| `npm install` or `npm test` fails at once | Node is too old. Check `node -v` (22.12 or newer). |
