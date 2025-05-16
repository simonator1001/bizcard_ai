'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';

export default function AuthDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [cookieData, setCookieData] = useState<Record<string, string>>({});
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  
  // Function to refresh data
  const refreshData = async () => {
    try {
      // Get session
      const { data: { session }, error } = await supabase.auth.getSession();
      setSessionData(session);
      
      // Get cookies
      const cookies: Record<string, string> = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, ...value] = cookie.trim().split('=');
        if (name) {
          cookies[name] = value.join('=');
        }
      });
      setCookieData(cookies);
      
      // Get localStorage
      const storage: Record<string, string> = {};
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          storage[key] = localStorage.getItem(key) || '';
        }
      });
      setLocalStorageData(storage);
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
  };
  
  // Function to clear all auth data
  const clearAllData = () => {
    try {
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        }
      });
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Refresh data
      refreshData();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };
  
  // Function to start a test auth flow
  const testGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/v1/callback?next=/auth/debug`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Error starting OAuth flow:', error);
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in OAuth test:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Initialize on mount
  useEffect(() => {
    refreshData();
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={refreshData}>Refresh Data</Button>
            <Button onClick={clearAllData} variant="destructive">Clear All Auth Data</Button>
            <Button onClick={testGoogleAuth}>Test Google Auth</Button>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Session Status:</h3>
            <pre className="bg-slate-100 p-3 rounded overflow-auto text-xs max-h-60">
              {sessionData ? 'Authenticated' : 'Not Authenticated'}
            </pre>
          </div>
          
          {sessionData && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Session Data:</h3>
              <pre className="bg-slate-100 p-3 rounded overflow-auto text-xs max-h-60">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Auth Cookies:</h3>
            <pre className="bg-slate-100 p-3 rounded overflow-auto text-xs max-h-60">
              {JSON.stringify(
                Object.entries(cookieData)
                  .filter(([key]) => key.includes('supabase') || key.includes('sb-'))
                  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
                null, 2
              )}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">LocalStorage Auth Items:</h3>
            <pre className="bg-slate-100 p-3 rounded overflow-auto text-xs max-h-60">
              {JSON.stringify(
                Object.entries(localStorageData).reduce((acc, [key, value]) => {
                  return {
                    ...acc,
                    [key]: value.length > 100 ? `${value.substring(0, 100)}... (${value.length} chars)` : value
                  };
                }, {}),
                null, 2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 