require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // User IDs
  const glowgirlsId = '5b888a04-79a4-4c96-bf2d-2c97f1ed0ccf';
  const simonId = '59e6e6b7-3ffd-4141-bd18-1e6d00de41c9'; // Replace with actual ID

  // Check cards for glowgirls
  const { data: glowgirlsCards } = await adminClient
    .from('business_cards')
    .select('*')
    .eq('user_id', glowgirlsId);

  console.log(`Cards owned by glowgirls (${glowgirlsId}):`, glowgirlsCards?.length || 0);

  // Check cards for simon
  const { data: simonCards } = await adminClient
    .from('business_cards')
    .select('*')
    .eq('user_id', simonId);

  console.log(`Cards owned by simon (${simonId}):`, simonCards?.length || 0);

  // Check subscription status
  const { data: glowgirlsSub } = await adminClient
    .from('users')
    .select('subscription_tier')
    .eq('id', glowgirlsId)
    .single();

  const { data: simonSub } = await adminClient
    .from('users')
    .select('subscription_tier')
    .eq('id', simonId)
    .single();

  console.log('Glowgirls subscription:', glowgirlsSub?.subscription_tier);
  console.log('Simon subscription:', simonSub?.subscription_tier);
}

main().catch(console.error); 