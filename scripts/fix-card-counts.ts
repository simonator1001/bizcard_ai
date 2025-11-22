import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCardCounts() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id');

    if (usersError) throw usersError;

    for (const user of users) {
      // Get actual card count
      const { count: totalCards, error: countError } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      // Get unique companies count
      const { data: companies, error: companiesError } = await supabase
        .from('business_cards')
        .select('company')
        .eq('user_id', user.id)
        .not('company', 'is', null);

      if (companiesError) throw companiesError;

      const uniqueCompanies = new Set(companies?.map(card => card.company.toLowerCase()));

      // Update users table
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ card_count: totalCards })
        .eq('id', user.id);

      if (updateUserError) throw updateUserError;

      // Update subscription_usage table
      const { error: updateUsageError } = await supabase
        .from('subscription_usage')
        .update({
          total_cards: totalCards,
          companies_tracked: uniqueCompanies.size
        })
        .eq('user_id', user.id)
        .eq('month', new Date().toISOString().slice(0, 7) + '-01');

      if (updateUsageError) throw updateUsageError;

      console.log(`Updated counts for user ${user.id}:`, {
        totalCards,
        uniqueCompanies: uniqueCompanies.size
      });
    }

    console.log('Successfully fixed card counts for all users');
  } catch (error) {
    console.error('Error fixing card counts:', error);
  }
}

// Run the fix
fixCardCounts(); 