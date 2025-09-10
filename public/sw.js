// DirectoryBolt Service Worker for Performance Optimization
const CACHE_NAME = 'directorybolt-v1.2'
const STATIC_CACHE = 'directorybolt-static-v1.2'
const DYNAMIC_CACHE = 'directorybolt-dynamic-v1.2'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/pricing',
  '/analyze',
  '/hero.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/site.webmanifest',
  '/robots.txt'
]

// Cache strategies for different content types
const CACHE_STRATEGIES = {
  images: 'cache-first',
  fonts: 'cache-first',
  css: 'stale-while-revalidate',
  js: 'stale-while-revalidate',
  html: 'network-first',
  api: 'network-first'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests (except fonts and images)
  if (url.origin !== location.origin && !isAllowedExternal(url)) return
  
  event.respondWith(handleRequest(request))
})

// Handle different types of requests with appropriate strategies
async function handleRequest(request) {
  const url = new URL(request.url)
  const contentType = getContentType(url.pathname)
  
  try {
    switch (contentType) {
      case 'images':
        return await cacheFirst(request, STATIC_CACHE)
      
      case 'fonts':
        return await cacheFirst(request, STATIC_CACHE)
      
      case 'css':
      case 'js':
        return await staleWhileRevalidate(request, STATIC_CACHE)
      
      case 'html':
        return await networkFirst(request, DYNAMIC_CACHE)
      
      case 'api':
        return await networkFirst(request, DYNAMIC_CACHE, 3000) // 3s timeout
      
      default:
        return await networkFirst(request, DYNAMIC_CACHE)
    }
  } catch (error) {
    console.error('Service Worker: Request failed', error)
    return await handleOffline(request)
  }
}

// Cache First Strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
    }).catch(() => {}) // Ignore network errors
    
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network First Strategy - for dynamic content
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    ])
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error.message)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale While Revalidate Strategy - for CSS/JS
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Always try to update cache in background
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {}) // Ignore network errors
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Otherwise wait for network
  return await networkResponsePromise
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url)
  
  // For HTML pages, return a cached page or offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match('/')
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>DirectoryBolt - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <h1>DirectoryBolt</h1>
          <p class="offline">You're currently offline. Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
  
  // For other requests, return a basic error response
  return new Response('Offline', { status: 503 })
}

// Utility functions
function getContentType(pathname) {
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) return 'images'
  if (pathname.match(/\.(woff|woff2|ttf|eot)$/i)) return 'fonts'
  if (pathname.match(/\.css$/i)) return 'css'
  if (pathname.match(/\.js$/i)) return 'js'
  if (pathname.startsWith('/api/')) return 'api'
  if (pathname.match(/\.(html|htm)$/i) || !pathname.includes('.')) return 'html'
  return 'other'
}

function isAllowedExternal(url) {
  const allowedDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'www.google-analytics.com',
    'www.googletagmanager.com'
  ]
  
  return allowedDomains.some(domain => url.hostname.includes(domain))
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implement background sync logic for failed API requests
  console.log('Service Worker: Background sync triggered')
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/favicon-32x32.png',
        data: data.url
      })
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})