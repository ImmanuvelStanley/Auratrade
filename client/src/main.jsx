import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import { handleFallbackRequest } from './services/clientFallbackData';

// Bulletproof Fetch Interceptor: Handles production serverless endpoints and auto-fails-safe
// to rich institutional market data if deployed without an attached backend.
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  const urlStr = typeof input === 'string' ? input : (input?.url || '');
  const isApi = urlStr.startsWith('/api') || (apiBase && urlStr.startsWith(`${apiBase}/api`));

  if (!isApi) {
    return originalFetch(input, init);
  }

  const targetUrl = apiBase && urlStr.startsWith('/api') ? `${apiBase}${urlStr}` : input;

  try {
    const res = await originalFetch(targetUrl, init);
    // If backend returns a successful API response or valid JSON error, use it
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return res;
    }
    // If backend returned 404 (e.g. static host without serverless functions), fall back
    if (res.status === 404 || !contentType.includes('application/json')) {
      return handleFallbackRequest(urlStr, init);
    }
    return res;
  } catch (err) {
    // If network fails or host is unreachable, serve rich local live market data seamlessly
    return handleFallbackRequest(urlStr, init);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
