import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Gracefully ignore transient backend reboot disconnects
            if (['ECONNRESET', 'ECONNREFUSED', 'EPIPE'].includes(err.code)) return;
          });
        }
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          // Intercept proxy-level error emission (suppresses transient upstream reconnect blips)
          const origProxyEmit = proxy.emit.bind(proxy);
          proxy.emit = function (event, ...args) {
            if (event === 'error') {
              const err = args[0];
              if (err && (['ECONNRESET', 'ECONNREFUSED', 'EPIPE'].includes(err.code) || err.message?.includes('ECONNRESET'))) {
                return false;
              }
            }
            return origProxyEmit(event, ...args);
          };

          // Intercept client-level WebSocket error emission (suppresses ECONNRESET from Vite logger during tab reload / HMR)
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            const origSocketEmit = socket.emit.bind(socket);
            socket.emit = function (event, ...args) {
              if (event === 'error') {
                const err = args[0];
                if (err && (['ECONNRESET', 'ECONNREFUSED', 'EPIPE'].includes(err.code) || err.message?.includes('ECONNRESET'))) {
                  return false;
                }
              }
              return origSocketEmit(event, ...args);
            };
          });
        }
      }
    }
  }
});
