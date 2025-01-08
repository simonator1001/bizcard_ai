import { supabase } from '@/lib/supabase-client';

async function ensureUser(userId: string) {
  // Check if user exists
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user:', error);
    throw error;
  }

  if (!existingUser) {
    // Get user details from auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Error getting user details:', authError);
      throw authError;
    }

    // Insert new user
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email: user?.email,
      subscription_type: 'free',
      card_count: 0,
      max_cards: 5
    });

    if (insertError) {
      console.error('Error creating user:', insertError);
      throw insertError;
    }
  }
}

export async function checkSubscriptionLimit(userId: string): Promise<{
  canAddCard: boolean;
  currentCount: number;
  maxCards: number | null;
  message?: string;
}> {
  try {
    await ensureUser(userId);

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_type, card_count, max_cards')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return {
        canAddCard: true,
        currentCount: 0,
        maxCards: 5,
        message: 'Error checking subscription status'
      };
    }

    const currentCount = user.card_count || 0;
    const maxCards = user.max_cards;

    return {
      canAddCard: maxCards === null || currentCount < maxCards,
      currentCount,
      maxCards,
      message: maxCards !== null && currentCount >= maxCards
        ? 'You have reached your card limit. Please upgrade your subscription to add more cards.'
        : undefined
    };
  } catch (error) {
    console.error('Error in checkSubscriptionLimit:', error);
    return {
      canAddCard: true,
      currentCount: 0,
      maxCards: 5,
      message: 'Error checking subscription status'
    };
  }
}

export async function updateSubscription(
  userId: string,
  planType: 'free' | 'pro',
  stripeSubscriptionId?: string
): Promise<void> {
  try {
    await ensureUser(userId);

    const { error } = await supabase
      .from('users')
      .update({
        subscription_type: planType,
        max_cards: planType === 'pro' ? null : 5,
        stripe_subscription_id: stripeSubscriptionId
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    throw error;
  }
}