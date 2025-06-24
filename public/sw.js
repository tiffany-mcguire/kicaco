const CACHE_NAME = 'kicaco-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Handle share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target POST requests
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    
    // Extract shared data
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';
    const files = formData.getAll('files');
    
    // Create URL with parameters for the share processor
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (text) params.append('text', text);
    if (url) params.append('url', url);
    
    // For files, we'll need to handle them differently
    // Store in IndexedDB or handle via the main thread
    if (files.length > 0) {
      // Store files temporarily and add a file indicator
      params.append('hasFiles', 'true');
      // Note: File handling would need more complex implementation
    }
    
    // Redirect to share processor with parameters
    const shareUrl = `/share?${params.toString()}`;
    
    return Response.redirect(shareUrl, 302);
  } catch (error) {
    console.error('Error handling share target:', error);
    return Response.redirect('/', 302);
  }
}

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 