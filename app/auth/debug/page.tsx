'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'

export default function AuthDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [authCookies, setAuthCookies] = useState<any>({});
  const [localStorageAuth, setLocalStorageAuth] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('')
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const router = useRouter()
  
  useEffect(() => {
    // Get current Supabase session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSessionData(data.session);
      
      if (error) {
        console.error('Session error:', error);
      }
    };

    // Get auth cookies
    const getCookies = () => {
      const cookies: Record<string, string> = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          cookies[name] = value;
        }
      });
      setAuthCookies(cookies);
    };

    // Get localStorage auth items
    const getLocalStorage = () => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          try {
            items[key] = localStorage.getItem(key) || '';
          } catch (e) {
            items[key] = 'Error accessing: ' + String(e);
          }
        }
      }
      setLocalStorageAuth(items);
    };

    checkSession();
    getCookies();
    getLocalStorage();

    // Check URL for auth fragments or query params
    const url = new URL(window.location.href);
    setRedirectUrl(url.toString());
    if (url.hash || url.search) {
      setTestResult(`URL contains auth parameters: Hash: ${url.hash}, Search: ${url.search}`);
    }
  }, []);
  
  const refreshData = () => {
    window.location.reload();
  };
  
  const clearAuthData = () => {
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (name.includes('supabase') || name.includes('sb-'))) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    });

    // Clear localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Error removing storage item:', e);
        }
      }
    }

    // Sign out
    supabase.auth.signOut();

    // Refresh the page
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const testGoogleAuth = async () => {
    try {
      setTestResult('Initiating Google Auth test...');

      // Use the callback URL from environment variable
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
      }
      const redirectTo = `${supabaseUrl}/auth/v1/callback`;

      // Log detailed information
      console.log('Auth test config:', {
        redirectTo,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        usingSupabaseRedirect: true
      });

      // Clear all previous cookies first
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
      });

      // Clear localStorage auth items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error('Error removing storage item:', e);
          }
        }
      }

      // Initiate the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            // Force Google to show account picker
            prompt: 'select_account',
            // Add additional debugging parameters
            access_type: 'offline'
          }
        }
      });

      if (error) {
        setTestResult(`Error: ${error.message}`);
        console.error('Test error:', error);
      } else {
        setTestResult('Redirecting to Google...');
        console.log('OAuth flow initiated:', data);
      }
    } catch (e) {
      setTestResult(`Unexpected error: ${String(e)}`);
      console.error('Test exception:', e);
    }
  };

  const handleManualRedirectTest = async () => {
    // Manually handle the URL for testing purposes
    const url = new URL(window.location.href);
    
    // Check for code parameter
    const code = url.searchParams.get('code');
    if (code) {
      try {
        setTestResult(`Found code: ${code.substring(0, 10)}... - Attempting exchange...`);
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setTestResult(`Exchange error: ${error.message}`);
        } else {
          setTestResult(`Success! User authenticated: ${data.user?.email}`);
        }
      } catch (e) {
        setTestResult(`Manual exchange error: ${String(e)}`);
      }
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug</CardTitle>
          <CardDescription>Troubleshoot authentication issues</CardDescription>
          <div className="flex gap-2">
            <Button onClick={refreshData}>Refresh Data</Button>
            <Button onClick={clearAuthData} variant="destructive">Clear All Auth Data</Button>
            <Button onClick={testGoogleAuth} variant="outline">Test Google Auth</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {testResult && (
            <div className="p-4 bg-slate-100 rounded">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
              <Button className="mt-2" onClick={handleManualRedirectTest} size="sm">
                Check URL Params
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Session Status:</h3>
            <pre className="p-4 bg-slate-100 rounded">
              {sessionData ? `Authenticated as: ${sessionData.user.email}` : 'Not Authenticated'}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Current URL:</h3>
            <pre className="p-4 bg-slate-100 rounded whitespace-pre-wrap text-sm">
              {redirectUrl}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Environment:</h3>
            <pre className="p-4 bg-slate-100 rounded whitespace-pre-wrap text-sm">
              {`Origin: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}
Hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'N/A'}
Protocol: ${typeof window !== 'undefined' ? window.location.protocol : 'N/A'}
Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not available'}`}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Auth Cookies:</h3>
            <pre className="p-4 bg-slate-100 rounded whitespace-pre-wrap text-sm">
              {JSON.stringify(authCookies, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">LocalStorage Auth Items:</h3>
            <pre className="p-4 bg-slate-100 rounded whitespace-pre-wrap text-sm">
              {JSON.stringify(localStorageAuth, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 