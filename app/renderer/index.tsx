import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Renderer root element not found');
}

// deterministic app boot flag for tests
// @ts-ignore
window.__APP_READY__ = true;
document.documentElement.setAttribute('data-app-ready', '1');
console.log('[dbg:boot] app ready');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
