import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/noto-serif/400.css';
import '@fontsource/noto-serif/700.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/600.css';
import './styles/global.css';
import App from './App';
import { initLenis } from './lib/lenis';

// Init smooth scroll before React renders
initLenis();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
