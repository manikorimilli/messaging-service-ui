import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Follow the operating system's light or dark setting. index.html applies the
// initial value before the first paint; this keeps it in sync afterwards.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkQuery.addEventListener('change', (e) => document.documentElement.classList.toggle('dark', e.matches));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
