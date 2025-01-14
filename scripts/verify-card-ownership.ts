require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables');
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCardOwnership() {
  // Find simon.ckchow's user ID
  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('*')
    .eq('email', 'simon.ckchow@gmail.com')
    .single();

  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Found user:', user);

  // Get all cards owned by simon.ckchow
  const { data: cards, error: cardsError } = await adminClient
    .from('business_cards')
    .select('*')
    .eq('user_id', user.id);

  if (cardsError) {
    console.error('Error getting cards:', cardsError);
    return;
  }

  if (!cards) {
    console.log('No cards found');
    return;
  }

  console.log(`User owns ${cards.length} cards`);
  console.log('Sample cards:');
  cards.slice(0, 3).forEach(card => console.log(card));

  // Check for any remaining cards with the old user_id
  const { data: oldCards, error: oldCardsError } = await adminClient
    .from('business_cards')
    .select('*')
    .eq('user_id', '5b888a04-79a4-4c96-bf2d-2c97f1ed0ccf');

  if (oldCardsError) {
    console.error('Error checking old cards:', oldCardsError);
    return;
  }

  if (oldCards && oldCards.length > 0) {
    console.log(`Found ${oldCards.length} cards still with old user_id`);
    console.log('Sample old cards:');
    oldCards.slice(0, 3).forEach(card => console.log(card));
  } else {
    console.log('No cards found with old user_id - migration successful!');
  }
}

verifyCardOwnership()
  .catch(console.error); 