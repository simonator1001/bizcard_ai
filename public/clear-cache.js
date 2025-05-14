// This is a utility script to clear cache, but we don't want it to run automatically
// Instead, it will be available as a function that can be called when needed

// Define a function to clear caches
window.clearAppCache = function() {
  console.log('Manual cache clearing initiated');
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        console.log('Clearing cache:', cacheName);
        caches.delete(cacheName);
      });
    });
  }

  console.log('Cache cleared at:', new Date().toISOString());
};

// Define a function to clear authentication
window.clearAuthData = function() {
  console.log('Manual auth clearing initiated');
  
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

  console.log('Auth data cleared at:', new Date().toISOString());
};

// This script no longer runs automatically on page load
console.log('Cache utility loaded - use window.clearAppCache() or window.clearAuthData() to clear data'); 