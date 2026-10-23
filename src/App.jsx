import { useEffect, useState } from 'react';
import { config } from './config.js';
import { BulkSmsPage } from './pages/BulkSmsPage.jsx';
import { ProvidersPage } from './pages/ProvidersPage.jsx';
import { ScheduledJobsPage } from './pages/ScheduledJobsPage.jsx';
import { SendSmsPage } from './pages/SendSmsPage.jsx';

const ROUTES = {
  providers: { label: 'Providers', Page: ProvidersPage },
  send: { label: 'Send SMS', Page: SendSmsPage },
  bulk: { label: 'Bulk SMS', Page: BulkSmsPage },
  scheduled: { label: 'Scheduled jobs', Page: ScheduledJobsPage },
};
const FUTURE_CHANNELS = ['Email', 'Call', 'WhatsApp'];

function routeFromHash() {
  const key = window.location.hash.replace(/^#\/?/, '');
  return ROUTES[key] ? key : 'providers';
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { Page } = ROUTES[route];

  return (
    <div className="app">
      {config.useMockApi && (
        <div className="mock-banner" role="note">
          <strong>Mock mode.</strong> Providers and send results are simulated in your browser. No requests reach the
          backend.
        </div>
      )}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Messaging Console</span>
        </div>
        <nav className="nav" aria-label="Main">
          {Object.entries(ROUTES).map(([key, { label }]) => (
            <a key={key} href={`#/${key}`} className={route === key ? 'nav-link active' : 'nav-link'} aria-current={route === key ? 'page' : undefined}>
              {label}
            </a>
          ))}
          {FUTURE_CHANNELS.map((name) => (
            <span key={name} className="nav-link nav-future" title="Planned. Not supported by the backend yet.">
              {name} <small>soon</small>
            </span>
          ))}
        </nav>
        <div className="env-pill" title={config.useMockApi ? 'Using the in-browser mock API' : `Base URL: ${config.apiBaseUrl || window.location.origin}`}>
          {config.useMockApi ? 'Mock API' : `Live: ${config.apiBaseUrl || 'same origin (proxy)'}`}
        </div>
      </header>
      <main className="main">
        <Page />
      </main>
    </div>
  );
}
