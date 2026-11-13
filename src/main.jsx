import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { overviewRedirect } from './utils/routes.js';
import './index.css';

// /overview is a hidden page: rewrite the address to its hash route before the app reads it.
const redirect = overviewRedirect(window.location.pathname, window.location.hash);
if (redirect) window.history.replaceState(null, '', redirect);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
