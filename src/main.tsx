import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: 'DM Sans, system-ui, sans-serif',
          background: 'var(--color-island-dark)',
          color: '#FFFFFF',
          borderRadius: '10px',
        },
        success: {
          iconTheme: { primary: 'var(--color-success)', secondary: '#FFFFFF' },
        },
        error: {
          iconTheme: { primary: 'var(--color-error)', secondary: '#FFFFFF' },
        },
      }}
    />
  </StrictMode>
);
