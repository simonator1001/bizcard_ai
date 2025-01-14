require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with anon key to simulate regular user
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Initialize admin client with service role key
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

interface BusinessCard {
  id: string
  user_id: string
  name: string
  company: string
  title: string
  email: string
  phone: string
  created_at: string
}

interface UserUsageStats {
  id: string
  user_id: string
  month: string
  scans_count: number
  companies_tracked: number
  total_cards: number
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  role: string
}

interface UserData {
  id: string
  subscription_type: string
  max_cards: number | null
}

async function testRLS() {
  try {
    // First, get simon.ckchow's user ID from auth
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError);
      return;
    }

    const simonUser = users.find((u: User) => u.email === 'simon.ckchow@gmail.com');
    if (!simonUser) {
      console.log('Could not find simon.ckchow@gmail.com user');
      return;
    }

    console.log('Found user:', {
      id: simonUser.id,
      email: simonUser.email,
      role: simonUser.role
    });

    // Check current subscription
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', simonUser.id)
      .single();

    if (userError) {
      console.error('Error getting user data:', userError);
      return;
    }

    console.log('Current user data:', userData);

    // Upgrade to pro if not already
    if (userData?.subscription_type !== 'pro') {
      console.log('Upgrading to pro subscription...');
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          subscription_type: 'pro',
          max_cards: null // null means unlimited
        })
        .eq('id', simonUser.id);

      if (updateError) {
        console.error('Error upgrading subscription:', updateError);
        return;
      }

      console.log('Successfully upgraded to pro subscription');
    }

    // Check business cards
    const { data: cards, error: cardsError } = await adminClient
      .from('business_cards')
      .select('*')
      .eq('user_id', simonUser.id);

    if (cardsError) {
      console.error('Error getting cards:', cardsError);
      return;
    }

    console.log('User has', cards?.length || 0, 'business cards');
    if (cards && cards.length > 0) {
      console.log('Sample cards:');
      cards.slice(0, 5).forEach((card: BusinessCard) => console.log(card));
    }

    // Check for orphaned cards
    console.log('Checking for orphaned cards...');
    const { data: orphanedCards, error: listError } = await adminClient
      .from('business_cards')
      .select('*')
      .eq('user_id', simonUser.id);

    if (listError) {
      console.error('Error listing cards:', listError);
    } else if (orphanedCards) {
      console.log(`Found ${orphanedCards.length} orphaned cards`);
      if (orphanedCards.length > 0) {
        console.log('Sample orphaned cards:');
        orphanedCards.slice(0, 5).forEach(card => console.log(card));
      }
    }

    // Check for cards with other user_id
    console.log('Checking for cards with other user_id...');
    const { data: cardsToUpdate, error: updateError } = await adminClient
      .from('business_cards')
      .select('*')
      .neq('user_id', simonUser.id);

    if (updateError) {
      console.error('Error checking other cards:', updateError);
    } else if (cardsToUpdate) {
      console.log(`Found ${cardsToUpdate.length} cards with other user_id`);
      if (cardsToUpdate.length > 0) {
        console.log('Sample cards with other user_id:');
        cardsToUpdate.slice(0, 5).forEach(card => console.log(card));
      }
    }

    // Update card ownership
    console.log('Updating card ownership...');
    const { data: cardsToUpdate, error: updateError } = await adminClient
      .from('business_cards')
      .select('*')
      .eq('user_id', '5b888a04-79a4-4c96-bf2d-2c97f1ed0ccf');

    if (updateError) {
      console.error('Error getting cards to update:', updateError);
    } else if (cardsToUpdate) {
      console.log(`Found ${cardsToUpdate.length} cards to update`);
      
      for (const card of cardsToUpdate) {
        const { error: updateError } = await adminClient
          .from('business_cards')
          .update({ user_id: simonUser.id })
          .eq('id', card.id);
          
        if (updateError) {
          console.error(`Error updating card ${card.id}:`, updateError);
        }
      }
      
      console.log('Finished updating card ownership');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testRLS(); 

testRLS() 