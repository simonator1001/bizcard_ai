async function ensureUser(userId: string) {
  // ... existing code ...
  if (!existingUser) {
    await supabase.from('users').insert({
      id: userId,
      email: user?.email,
      subscription_type: 'free',
      card_count: 0,
      max_cards: 5
    });
  }
}

export async function checkSubscriptionLimit(userId: string): Promise<{
  canAddCard: boolean;
  currentCount: number;
  maxCards: number | null;
  message?: string;
}> {
  // ... existing code ...

  if (error) {
    console.error('Error fetching user subscription:', error);
    return {
      canAddCard: true,
      currentCount: 0,
      maxCards: 5,
      message: 'Error checking subscription status'
    };
  }
  // ... rest of the code
}

export async function updateSubscription(
  userId: string,
  planType: 'free' | 'pro',
  stripeSubscriptionId?: string
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      subscription_type: planType,
      max_cards: planType === 'pro' ? null : 5
    })
    .eq('id', userId);
  // ... rest of the code
}