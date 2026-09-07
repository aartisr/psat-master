import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const firebaseEnv: Record<string, string> = {};
  const configPath = path.resolve(__dirname, './firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config) {
        firebaseEnv['import.meta.env.VITE_FIREBASE_PROJECT_ID'] = JSON.stringify(config.projectId || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_APP_ID'] = JSON.stringify(config.appId || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_API_KEY'] = JSON.stringify(config.apiKey || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_AUTH_DOMAIN'] = JSON.stringify(config.authDomain || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_DATABASE_ID'] = JSON.stringify(config.firestoreDatabaseId || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_STORAGE_BUCKET'] = JSON.stringify(config.storageBucket || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID'] = JSON.stringify(config.messagingSenderId || '');
        firebaseEnv['import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID'] = JSON.stringify(config.oAuthClientId || '');
      }
    } catch (e) {
      console.warn('Could not load or parse firebase-applet-config.json:', e);
    }
  } else {
    // Fallback to reading from process.env if the config file is not present
    firebaseEnv['import.meta.env.VITE_FIREBASE_PROJECT_ID'] = JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_APP_ID'] = JSON.stringify(process.env.VITE_FIREBASE_APP_ID || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_API_KEY'] = JSON.stringify(process.env.VITE_FIREBASE_API_KEY || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_AUTH_DOMAIN'] = JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_DATABASE_ID'] = JSON.stringify(process.env.VITE_FIREBASE_DATABASE_ID || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_STORAGE_BUCKET'] = JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID'] = JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
    firebaseEnv['import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID'] = JSON.stringify(process.env.VITE_FIREBASE_OAUTH_CLIENT_ID || '');
  }

  return {
    base: process.env.VITE_BASE_PATH || '/',
    define: firebaseEnv,
    plugins: [
      {
        name: 'vite-hmr-suppressor',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                attrs: { id: 'vite-suppression-shim' },
                children: `
(function() {
  var origWebSocket = window.WebSocket;
  function isViteHmr(url, protocols) {
    if (protocols === 'vite-hmr' || protocols === 'vite-ping') return true;
    if (Array.isArray(protocols) && (protocols.indexOf('vite-hmr') !== -1 || protocols.indexOf('vite-ping') !== -1)) return true;
    if (typeof url === 'string' && (url.indexOf('vite-hmr') !== -1 || (url.indexOf('token=') !== -1 && (url.indexOf('ws://') !== -1 || url.indexOf('wss://') !== -1)))) return true;
    return false;
  }
  function DummyViteWebSocket(url, protocols) {
    var target = new EventTarget();
    this.url = url;
    this.readyState = 1;
    this.protocol = typeof protocols === 'string' ? protocols : (Array.isArray(protocols) ? protocols[0] : '');
    this.extensions = '';
    this.bufferedAmount = 0;
    this.binaryType = 'blob';
    this.send = function() {};
    this.close = function() { this.readyState = 3; };
    this.addEventListener = target.addEventListener.bind(target);
    this.removeEventListener = target.removeEventListener.bind(target);
    this.dispatchEvent = target.dispatchEvent.bind(target);
    var self = this;
    setTimeout(function() {
      if (self.readyState === 1) {
        var openEvt = new Event('open');
        if (typeof self.onopen === 'function') self.onopen(openEvt);
        self.dispatchEvent(openEvt);
      }
    }, 5);
  }
  DummyViteWebSocket.CONNECTING = 0;
  DummyViteWebSocket.OPEN = 1;
  DummyViteWebSocket.CLOSING = 2;
  DummyViteWebSocket.CLOSED = 3;

  if (origWebSocket) {
    window.WebSocket = function(url, protocols) {
      if (isViteHmr(url, protocols)) {
        return new DummyViteWebSocket(url, protocols);
      }
      return new origWebSocket(url, protocols);
    };
    window.WebSocket.prototype = origWebSocket.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
  }

  function isViteMsg(msg) {
    if (!msg) return false;
    var str = typeof msg === 'string' ? msg : (msg && msg.message ? msg.message : String(msg));
    return str.indexOf('[vite]') !== -1 || str.indexOf('websocket') !== -1;
  }

  window.addEventListener('unhandledrejection', function(event) {
    if (event && (isViteMsg(event.reason) || (event.reason && isViteMsg(event.reason.message)))) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('error', function(event) {
    if (event && (isViteMsg(event.message) || isViteMsg(event.error))) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
  }, true);

  var origErr = console.error;
  var origWarn = console.warn;
  console.error = function() {
    for (var i = 0; i < arguments.length; i++) {
      if (isViteMsg(arguments[i])) return;
    }
    origErr.apply(console, arguments);
  };
  console.warn = function() {
    for (var i = 0; i < arguments.length; i++) {
      if (isViteMsg(arguments[i])) return;
    }
    origWarn.apply(console, arguments);
  };
})();`,
                injectTo: 'head-prepend'
              }
            ];
          }
        }
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'PSAT Master | Digital PSAT & SAT Prep',
          short_name: 'PSAT Master',
          description: 'Digital PSAT/NMSQT & SAT preparation platform with 2,900 questions, adaptive drills, and analytics.',
          theme_color: '#2563eb',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
