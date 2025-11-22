require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables');
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function updateCardOwnership() {
  // Find simon.ckchow's user ID
  const { data: users, error: userError } = await adminClient
    .from('users')
    .select('*')
    .eq('email', 'simon.ckchow@gmail.com')
    .single();

  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }

  if (!users) {
    console.error('User not found');
    return;
  }

  const user = users;
  console.log('Found user:', user);

  // Get cards to update
  const { data: cardsToUpdate, error: cardsError } = await adminClient
    .from('business_cards')
    .select('*')
    .eq('user_id', '5b888a04-79a4-4c96-bf2d-2c97f1ed0ccf');

  if (cardsError) {
    console.error('Error getting cards to update:', cardsError);
    return;
  }

  if (!cardsToUpdate) {
    console.log('No cards found to update');
    return;
  }

  console.log(`Found ${cardsToUpdate.length} cards to update`);

  // Update card ownership
  for (const card of cardsToUpdate) {
    const { error: updateError } = await adminClient
      .from('business_cards')
      .update({ user_id: user.id })
      .eq('id', card.id);

    if (updateError) {
      console.error(`Error updating card ${card.id}:`, updateError);
    }
  }

  console.log('Finished updating card ownership');
}

updateCardOwnership()
  .catch(console.error); 