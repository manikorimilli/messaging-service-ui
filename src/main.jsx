import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme } from './lib/theme.js';
import { overviewRedirect } from './utils/routes.js';
import './index.css';

// index.html applies the saved or system theme before the first paint; this
// re-applies it once the app loads. Later changes go through lib/theme.js.
applyTheme();

// /overview is a hidden page: rewrite the address to its hash route before the app reads it.
const redirect = overviewRedirect(window.location.pathname, window.location.hash);
if (redirect) window.history.replaceState(null, '', redirect);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
