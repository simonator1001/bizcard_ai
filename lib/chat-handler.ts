import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-client';
import { getSystemPrompt } from '@/lib/prompts';
import { Message } from '@/types/chat';
import { chatWithPerplexity } from '@/lib/perplexity-client';

export async function handleChatRequest(messages: Message[]): Promise<string> {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's business cards
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select('name, title, company, email, phone, address, notes, created_at')
      .eq('user_id', user.id);

    if (cardsError) {
      console.error('Error fetching business cards:', cardsError);
      throw new Error('Error fetching business cards');
    }

    // Format business card data for the system prompt
    const businessCardData = {
      total_cards: cards.length,
      cards: cards.map(card => ({
        name: card.name || '',
        title: card.title || '',
        company: card.company || '',
        contact: {
          email: card.email || '',
          phone: card.phone || '',
          address: card.address || ''
        },
        notes: card.notes || '',
        added: card.created_at
      }))
    };

    // Add system prompt with business card data if not already present
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: getSystemPrompt() + '\n\nCurrent business card data:\n' + JSON.stringify(businessCardData, null, 2)
      });
    }

    // Call Perplexity API
    const response = await chatWithPerplexity(messages);
    return response.content;

  } catch (error) {
    console.error('Error in chat handler:', error);
    throw error;
  }
}
