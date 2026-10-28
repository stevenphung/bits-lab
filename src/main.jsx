import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Earlier versions installed a service worker (pixel-sw.js) for demo images; remove it from
// browsers that still have it.
navigator.serviceWorker?.getRegistrations().then(list => list.forEach(registration => registration.unregister())).catch(() => {});

// No <StrictMode>: the previews were tuned without its dev-only double mount.
createRoot(document.getElementById('root')).render(<App />);
