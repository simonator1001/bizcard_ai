import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { checkSubscriptionLimit } from './subscription-service'
import { supabase } from './supabase'

interface SubscriptionState {
  isProUser: boolean;
  cardCount: number;
  maxCards: number | null;
  canAddCard: boolean;
  subscriptionType: 'free' | 'pro';
}

interface SubscriptionContextType extends SubscriptionState {
  checkLimit: () => Promise<boolean>;
  refreshCardCount: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionState>({
    isProUser: false,
    cardCount: 0,
    maxCards: 5,
    canAddCard: true,
    subscriptionType: 'free'
  });

  const refreshCardCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('subscription_type, card_count, max_cards')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setSubscriptionData(prev => ({
        ...prev,
        cardCount: userData.card_count,
        maxCards: userData.max_cards,
        isProUser: userData.subscription_type === 'pro',
        subscriptionType: userData.subscription_type,
        canAddCard: userData.subscription_type === 'pro' || userData.card_count < userData.max_cards
      }));

      console.log('Updated subscription data:', userData);
    } catch (error) {
      console.error('Error refreshing card count:', error);
    }
  }, [user]);

  // Refresh on mount and when user changes
  useEffect(() => {
    refreshCardCount();
  }, [user, refreshCardCount]);

  const checkLimit = async () => {
    if (!user) return false;
    await refreshCardCount();
    return subscriptionData.canAddCard;
  };

  return (
    <SubscriptionContext.Provider 
      value={{
        ...subscriptionData,
        checkLimit,
        refreshCardCount
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}