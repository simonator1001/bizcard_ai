import { OrgChartView } from '@/components/OrgChartView';
import { NavBar } from '@/components/nav-bar';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OrgChartPage() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select(`
            id,
            name,
            title,
            title_zh,
            company,
            company_zh,
            email,
            phone,
            image_url
          `)
          .order('company');

        if (error) throw error;
        
        // Map the data correctly here
        const processedCards = (data || []).map(card => ({
          id: card.id,
          name: card.name,
          position: card.title || card.title_zh || 'No Position', // Set position from title fields
          company: card.company || card.company_zh || '',
          email: card.email || '',
          phone: card.phone || '',
          imageUrl: card.image_url,
          title: card.title,         // Keep original fields
          title_zh: card.title_zh    // Keep original fields
        }));

        console.log('Processed cards:', processedCards);
        setCards(processedCards);
      } catch (err) {
        setError('Failed to load business cards');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen pb-16">
        <main className="container mx-auto p-4">
          <OrgChartView data={cards} />
        </main>
        <NavBar />
      </div>
    </ThemeProvider>
  );
} 