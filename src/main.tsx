import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/geist-mono/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/system.css';
import { App } from './App';
import { normalisePath } from './lib/router';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered pages are hydrated. A host that falls back to the homepage's HTML for an
// unknown path (a 404, say) serves markup for a different route, so render that fresh.
if (root.dataset.prerendered === normalisePath(window.location.pathname)) hydrateRoot(root, app);
else createRoot(root).render(app);
