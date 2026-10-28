import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Swaps stock photos in component previews for local pixel-art postcards (public/pixel-sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pixel-sw.js').catch(() => {});
}

// No <StrictMode>: 53 React Bits WebGL components call loseContext() on unmount, so StrictMode's
// dev-only mount → unmount → mount leaves them with a dead canvas. reactbits.dev doesn't use it either.
createRoot(document.getElementById('root')).render(<App />);
