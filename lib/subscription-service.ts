import { supabase } from './supabase-client'

interface SubscriptionUsage {
  id: string
  user_id: string
  month: string
  scans_count: number
  companies_tracked: number
  total_cards: number
}

const LIMITS = {
  FREE: {
    scan: 10,
    companies: 5,
    cards: 50
  },
  PRO: {
    scan: 100,
    companies: 50,
    cards: 500
  },
  ENTERPRISE: {
    scan: Infinity,
    companies: Infinity,
    cards: Infinity
  }
}

export class SubscriptionService {
  static async canPerformAction(userId: string, action: 'scan' | 'company' | 'card'): Promise<boolean> {
    if (!userId) return false;

    try {
      // Get user's subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get current month's usage
      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const { data: usage } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      // Get plan limits
      const plan = subscription?.plan || 'FREE';
      const limits = LIMITS[plan as keyof typeof LIMITS];

      if (!usage) {
        // If no usage record exists, user can perform action
        return true;
      }

      // Check limits based on action
      switch (action) {
        case 'scan':
          return usage.scans_count < limits.scan;
        case 'company':
          return usage.companies_tracked < limits.companies;
        case 'card':
          return usage.total_cards < limits.cards;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  static async incrementUsage(userId: string, action: 'scan' | 'company' | 'card'): Promise<void> {
    if (!userId) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

    try {
      // Get or create usage record for current month
      const { data: existingUsage } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      if (!existingUsage) {
        // Create new usage record
        await supabase
          .from('subscription_usage')
          .insert([{
            user_id: userId,
            month: currentMonth,
            scans_count: action === 'scan' ? 1 : 0,
            companies_tracked: action === 'company' ? 1 : 0,
            total_cards: action === 'card' ? 1 : 0
          }]);
      } else {
        // Update existing usage record
        const updates: Partial<SubscriptionUsage> = {
          scans_count: action === 'scan' ? existingUsage.scans_count + 1 : existingUsage.scans_count,
          companies_tracked: action === 'company' ? existingUsage.companies_tracked + 1 : existingUsage.companies_tracked,
          total_cards: action === 'card' ? existingUsage.total_cards + 1 : existingUsage.total_cards
        };

        await supabase
          .from('subscription_usage')
          .update(updates)
          .eq('id', existingUsage.id);
      }
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  }
}