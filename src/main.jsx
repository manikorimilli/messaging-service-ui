import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme } from './lib/theme.js';
import './index.css';

// index.html applies the saved or system theme before the first paint; this
// re-applies it once the app loads. Later changes go through lib/theme.js.
applyTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
