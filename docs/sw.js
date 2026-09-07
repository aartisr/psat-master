// sw.js - Service worker kill-switch
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.clients.claim().then(function() {
    self.clients.matchAll().then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage('reload');
      });
    });
  });
});
