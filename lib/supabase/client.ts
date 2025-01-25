import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getBusinessCards() {
  const supabase = createClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Unauthorized - Please sign in');
  }

  // Fetch user's business cards
  const { data: cards, error: cardsError } = await supabase
    .from('business_cards')
    .select(`
      id,
      name,
      title,
      company,
      email,
      phone,
      address,
      notes,
      created_at,
      updated_at,
      user_id
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (cardsError) {
    console.error('Error fetching business cards:', cardsError);
    throw new Error('Failed to fetch business cards');
  }

  return cards;
}

export const createServiceClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
  );
}; 