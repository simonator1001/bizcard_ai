// This file forces the browser to clear the cache
// It is automatically included in the HTML

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    cacheNames.forEach(function(cacheName) {
      console.log('Clearing cache:', cacheName);
      caches.delete(cacheName);
    });
  });
}

// Force clear localStorage
for (const key of Object.keys(localStorage)) {
  if (key.startsWith('sb-') || key.includes('supabase')) {
    console.log('Clearing localStorage item:', key);
    localStorage.removeItem(key);
  }
}

// Force clear all cookies related to Supabase
document.cookie.split(';').forEach(function(cookie) {
  const [name] = cookie.trim().split('=');
  if (name && (name.startsWith('sb-') || name.includes('supabase'))) {
    console.log('Clearing cookie:', name);
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax`;
  }
});

console.log('Cache cleared at:', new Date().toISOString()); 