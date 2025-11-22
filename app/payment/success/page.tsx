"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { Loader2, CheckCircle, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Add a test mode flag for development
const TEST_MODE = false;

export default function PaymentSuccessPage() {
  const [updating, setUpdating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const searchParams = useSearchParams();

  // Add debug logs on component mount
  useEffect(() => {
    console.log('[Payment Success] Page loaded with session ID:', searchParams?.get('session_id'));
  }, [searchParams]);

  // Add debug logs
  console.log('[Payment Success Debug] Component state:', { 
    updating, 
    success, 
    error, 
    attempts,
    user: user ? { id: user.id, email: user.email } : 'No user',
    loading,
    sessionId: searchParams?.get('session_id')
  });

  // Helper function to verify subscription status directly from database
  const verifySubscriptionStatus = async (userId: string) => {
    try {
      console.log('[Payment Success] Verifying subscription status for user', userId);
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('[Payment Success] Error fetching subscription:', error);
        return false;
      }
      
      console.log('[Payment Success] Subscription data:', subscriptionData);
      return subscriptionData && subscriptionData.tier === 'pro' && subscriptionData.status === 'active';
    } catch (err) {
      console.error('[Payment Success] Error in verification:', err);
      return false;
    }
  };

  // Helper function to verify a checkout session with Stripe directly
  const verifyStripeSession = async (sessionId: string, token: string) => {
    try {
      console.log('[Payment Success] Verifying Stripe session:', sessionId);
      
      // If in test mode and session ID starts with 'test_session_', return success immediately
      if (TEST_MODE && sessionId.startsWith('test_session_')) {
        console.log('[Payment Success] TEST MODE: Simulating successful session verification');
        return true;
      }
      
      const response = await fetch(`/api/checkout/verify-session?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      const data = await response.json();
      console.log('[Payment Success] Session verification result:', data);
      return data.success;
    } catch (err) {
      console.error('[Payment Success] Error verifying session:', err);
      return false;
    }
  };

  useEffect(() => {
    // Wait until user is loaded
    if (loading) {
      console.log('[Payment Success] Still loading user data, waiting...');
      return;
    }

    if (!user) {
      console.log('[Payment Success] No user found, but not redirecting to allow loading');
      return;
    }

    // Add flag to prevent double invocation
    let isRunning = false;

    async function updateSubscription() {
      // Prevent double execution 
      if (isRunning) return;
      isRunning = true;

      try {
        console.log('[Payment Success] Starting subscription update process');
        setUpdating(true);
        setError(null);

        // Get session ID from URL
        const sessionId = searchParams?.get('session_id') || null;
        console.log('[Payment Success] Session ID from URL:', sessionId);
        
        // Test mode handling - THIS IS THE KEY CHANGE - we're ACTUALLY making a real update now in test mode
        if (TEST_MODE && sessionId && sessionId.startsWith('test_session_')) {
          console.log('[Payment Success] TEST MODE: Updating subscription in database');
          
          // Get session for auth token
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("No active session found");
          }
          
          // Force update the subscription
          const response = await fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              tier: 'pro', // Upgrade to pro tier
              provider: 'stripe',
              subscriptionId: sessionId || 'direct_payment',
              force_update: true // Add a flag to ensure update happens
            })
          });

          const data = await response.json();
          console.log('[Payment Success] API response:', data);

          if (response.ok && data.success) {
            setSuccess(true);
            toast({
              title: "Subscription upgraded!",
              description: "Your account has been upgraded to Pro.",
            });
            setUpdating(false);
            return;
          } else {
            throw new Error(data.error || "Failed to update subscription");
          }
        }
        
        // Get session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No active session found");
        }

        // First, check if the subscription is already upgraded
        const isSubscribed = await verifySubscriptionStatus(user!.id);
        if (isSubscribed) {
          console.log('[Payment Success] User already has an active pro subscription');
          setSuccess(true);
          toast({
            title: "Subscription active!",
            description: "You already have an active Pro subscription.",
          });
          setUpdating(false);
          return;
        }

        // If we have a session ID, verify it with Stripe
        if (sessionId) {
          // Try to verify the session with Stripe directly
          try {
            const isVerified = await verifyStripeSession(sessionId, session.access_token);
            if (isVerified) {
              // Set success - the webhook should handle the subscription update
              setSuccess(true);
              toast({
                title: "Payment verified!",
                description: "Your payment has been verified. Your subscription will be activated shortly.",
              });
              setUpdating(false);
              return;
            }
          } catch (err) {
            console.error('[Payment Success] Error verifying Stripe session:', err);
            // Continue with manual subscription update as fallback
          }
        }

        // Call our API endpoint to update the subscription manually
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            tier: 'pro', // Upgrade to pro tier
            provider: 'stripe',
            subscriptionId: sessionId || 'direct_payment'
          })
        });

        const data = await response.json();
        console.log('[Payment Success] API response:', data);

        if (response.ok && data.success) {
          setSuccess(true);
          toast({
            title: "Subscription upgraded!",
            description: "Your account has been upgraded to Pro.",
          });
        } else {
          // Even if our API call fails, give the webhook some more time to process
          // Set a small delay and check again
          setTimeout(async () => {
            const isNowSubscribed = await verifySubscriptionStatus(user!.id);
            if (isNowSubscribed) {
              console.log('[Payment Success] Subscription activated after delay');
              setSuccess(true);
              toast({
                title: "Subscription active!",
                description: "Your account has been verified as having an active Pro subscription.",
              });
            } else if (attempts < 2) {
              // Try one more time
              setAttempts(prevAttempts => prevAttempts + 1);
              console.log('[Payment Success] Retrying subscription check...');
              // This will trigger the effect to run again
            } else {
              setError(data.error || "Failed to update your subscription. Please contact support.");
              toast({
                title: "Upgrade failed",
                description: "There was a problem updating your subscription.",
                variant: "destructive",
              });
            }
            setUpdating(false);
          }, 3000);
          return;
        }
      } catch (err) {
        console.error("[Payment Success] Error updating subscription:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        toast({
          title: "Upgrade failed",
          description: "There was a problem updating your subscription.",
          variant: "destructive",
        });
      } finally {
        setUpdating(false);
      }
    }

    updateSubscription();
  }, [user, loading, toast, searchParams, attempts]);

  const handleContinue = () => {
    console.log('[Payment Success] User clicked Continue to Dashboard button, navigating to home');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Loading...</h1>
            <p className="text-muted-foreground">Please wait while we verify your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex justify-center min-h-[60vh]">
        <Card className="max-w-md w-full shadow-lg">
          {updating ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Processing Your Payment</CardTitle>
                <CardDescription>Please wait while we update your subscription</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-center">
                  This may take a few moments...
                </p>
              </CardContent>
            </>
          ) : success ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <CardDescription>Your subscription has been upgraded to Pro</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <p className="text-md mb-4">
                  You now have unlimited scans and access to all premium features.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your account has been upgraded but you may need to refresh the app to see all your new features.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Continue to Dashboard
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-red-100 p-3">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Payment Issue</CardTitle>
                <CardDescription>We encountered a problem with your payment</CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                  <p className="text-red-700 text-sm">
                    {error || "There was a problem processing your payment."}
                  </p>
                </div>
                <p className="text-sm mb-4">
                  Your payment might have been processed, but we couldn't update your subscription automatically.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Please try these steps:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Refresh this page to try again</li>
                    <li>Sign out and sign back in</li>
                    <li>Contact support with your payment confirmation</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={() => router.push('/pricing')} className="w-full sm:w-auto">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={handleContinue} className="w-full sm:w-auto">
                  Return to Dashboard
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
} 