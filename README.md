FRONTEND SETUP GUIDE

# Run the Messaging Console on your computer

The Messaging Console is the web app for the Messaging Service: manage providers, send single and bulk SMS,
and see the scheduled job runs. Follow these steps to run it locally. It takes about 10 minutes the first time.

> Tip: select a command in a grey box and copy it into your terminal. Paste one line at a time if your PDF
> reader joins lines.

## What you need

| | | |
|---|---|---|
| REQUIRED | **Node.js 22.12 or newer** | Comes with npm. Install commands are in step 1. |
| REQUIRED | **Git** | To download the code. Install commands are in step 1. |
| OPTIONAL | **The backend** | Only for live data. Without it, the app runs with sample data. |

> You don't need the backend to try the app. In **mock mode** (the default) providers, sends and job runs are
> simulated in your browser.

## Steps

### 1. Install Node.js and Git

Skip this step if `node -v` already shows v22.12 or higher and `git --version` works. Use the commands for
your system.

**MACOS (WITH HOMEBREW)**

If you don't have Homebrew yet, install it first:

```bash
/bin/bash -c "$(curl -fsSL \
https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install Node.js and Git:

```bash
brew install node git
```

**LINUX**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
```

The Node.js in the default Ubuntu list is too old, so the first line adds the official Node.js 22 source.

**WINDOWS (POWERSHELL OR COMMAND PROMPT)**

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```

Close the terminal and open a new one after installing, so it finds Node.js and Git.

**CHECK (ALL SYSTEMS)**

```bash
node -v
npm -v
git --version
```

`node -v` must show v22.12 or higher, for example `v24.11.0`.

### 2. Download the code

```bash
git clone https://github.com/manikorimilli/messaging-service-ui.git
cd messaging-service-ui
```

Run every command below from this `messaging-service-ui` folder.

### 3. Install the libraries

```bash
npm install
```

This takes about a minute and creates a `node_modules` folder. Run it again only when `package.json` changes.

### 4. Create your settings file

Copy the example file to a new file named `.env` in the same folder.

MACOS / LINUX

```bash
cp .env.example .env
```

WINDOWS

```bat
copy .env.example .env
```

> **Use the values as they are.** Unlike the backend, the frontend has no secret keys: the values in
> `.env.example` are the real settings, and nobody sends you separate values. There is nothing to fill in.

> `.env` is ignored by Git, so everyone keeps their own. Don't commit it.

### 5. Choose mock or live data

Open `.env` in any editor. As copied, it runs in **mock mode**, so you can skip to step 6.
For live data, change it to one of these:

.ENV: BACKEND ON YOUR COMPUTER

```
VITE_USE_MOCK_API=false
DEV_PROXY_TARGET=http://localhost:8080
```

.ENV: DEPLOYED BACKEND (AZURE)

```
VITE_USE_MOCK_API=false
DEV_PROXY_TARGET=https://messagin-service-gshecfhwaubth6fk.centralindia-01.azurewebsites.net
```

- For the first option, start the backend first. It must answer at `http://localhost:8080` (see the backend
  setup guide).
- The backend does not allow calls straight from the browser, so the app sends them through
  `DEV_PROXY_TARGET`. These two settings are all you need.
- No spaces and no quotes around values. Save the file, and restart the app after every change.

### 6. Start the app

ALL SYSTEMS

```bash
npm run dev
```

The app is ready when the log shows lines like:

```
VITE v8.3.5 ready in 300 ms
➜ Local: http://localhost:5173/
```

Keep this terminal open. To stop the app, press `Ctrl + C` in it.

### 7. Check that it works

Open this address in your browser. You should see the **Providers** page.

```
http://localhost:5173
```

The bottom of the sidebar shows **Mock mode** or a green **Live** badge, matching your choice in step 5.

Then send a test SMS: open **Send SMS**, enter a number in international format (for example
`+919876543210`), pick a message from the template menu, and click **Send SMS**. A green
**Accepted by provider** card means it worked.

> **Mock mode test numbers:** a number ending in `000` is rejected and one ending in `999` times out, so you
> can see how errors look. Any other number is accepted. In mock mode nothing is really sent.

## If something goes wrong

| YOU SEE | FIX |
|---|---|
| `node: command not found` or `npm: command not found` | Install Node.js (step 1) and open a new terminal. |
| `Vite requires Node.js version 20.19+ or 22.12+` | Node.js is too old. Install a newer one (step 1). `node -v` must show v22.12 or higher. |
| `running scripts is disabled on this system` (Windows) | PowerShell blocks npm. Use Command Prompt instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| `Port 5173 is in use, trying another one...` | Another program uses port 5173. The app picks the next free port: open the address the log prints. |
| The sidebar still says **Mock mode** | `VITE_USE_MOCK_API` must be exactly `false`. Save `.env`, stop the app with `Ctrl + C` and run `npm run dev` again. |
| `Cannot reach the server` in the app | Set `DEV_PROXY_TARGET` (step 5), delete any `VITE_API_BASE_URL` line from `.env`, then restart the app. |
| `http proxy error` and `ECONNREFUSED` in the terminal | The backend is not running at `DEV_PROXY_TARGET`. Start it, or use the Azure address. |

---

Source: github.com/manikorimilli/messaging-service-ui. More detail on the pages, settings and mock mode is in
the README in the repository.
