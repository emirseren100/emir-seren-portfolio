import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/geist-mono/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/system.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
