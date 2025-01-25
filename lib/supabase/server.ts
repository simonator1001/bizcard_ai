import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        async remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
          }
        }
      }
    }
  );
}

export async function getBusinessCards() {
  const supabase = await createClient();
  
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