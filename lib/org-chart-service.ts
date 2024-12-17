import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BusinessCard {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
}

interface OrgChartNode {
  id: string;
  name: string;
  position: string;
  email: string;
  children: OrgChartNode[];
  cardDetails?: BusinessCard;
}

export class OrgChartService {
  static async fetchCompanyCards(company: string): Promise<BusinessCard[]> {
    console.log('Fetching cards for company:', company);
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('company', company)
      .order('position');

    if (error) throw new Error('Failed to fetch business cards');
    console.log('Fetched cards:', data);
    return data || [];
  }

  static async analyzeRelationships(cards: BusinessCard[]): Promise<OrgChartNode> {
    console.log('Analyzing relationships for cards:', cards);
    try {
      // Prepare the prompt for Perplexity AI
      const prompt = `
        Analyze these business cards and create a hierarchical organization structure.
        Business cards: ${JSON.stringify(cards, null, 2)}

        Rules for analysis:
        1. Use job titles/positions to determine reporting relationships
        2. Consider common organizational hierarchies:
           - C-level (CEO, CTO, CFO) at top
           - Directors/VPs report to C-level
           - Managers report to Directors
           - Team members report to Managers
        3. Return a JSON object with this exact structure:
        {
          "id": string,
          "name": string,
          "position": string,
          "email": string,
          "children": [] (array of objects with the same structure)
        }

        Consider these title hierarchies:
        - Level 1 (Top): CEO, President, Founder, Chairman, Chief*, Director
        - Level 2: VP, Vice President, Head of, General Manager
        - Level 3: Senior Manager, Manager, Lead
        - Level 4: Senior, Principal, Team Lead
        - Level 5: Associate, Junior, Staff

        Return only the JSON object, no additional text.
      `;

      console.log('Sending request to Perplexity AI');
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-instruct',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 2000,
        }),
      });

      console.log('Perplexity API response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to analyze relationships with Perplexity AI');
      }

      const result = await response.json();
      console.log('Perplexity AI result:', result);

      const orgStructure = JSON.parse(result.choices[0].message.content);
      console.log('Parsed org structure:', orgStructure);

      // Add cardDetails to each node
      const addCardDetails = (node: OrgChartNode) => {
        console.log('Adding card details to node:', node);
        const card = cards.find(c => c.id === node.id);
        if (card) {
          node.cardDetails = card;
        }
        node.children.forEach(addCardDetails);
        return node;
      };

      return addCardDetails(orgStructure);

    } catch (error) {
      console.error('Perplexity AI analysis failed:', error);
      console.log('Falling back to simple hierarchy');
      
      // Fallback: Create a simple hierarchy based on title keywords
      const positionHierarchy = {
        level1: ['ceo', 'chief', 'president', 'founder', 'chairman', 'director'],
        level2: ['vp', 'vice president', 'head', 'general manager'],
        level3: ['manager', 'lead', 'supervisor'],
        level4: ['senior', 'principal', 'team lead'],
        level5: ['associate', 'junior', 'staff'],
      };

      const getLevel = (position: string): number => {
        position = position.toLowerCase();
        for (const [level, titles] of Object.entries(positionHierarchy)) {
          if (titles.some(title => position.includes(title))) {
            return parseInt(level.replace('level', ''));
          }
        }
        return 6;
      };

      // Sort cards by hierarchy level
      const sortedCards = [...cards].sort((a, b) => {
        const levelA = getLevel(a.position);
        const levelB = getLevel(b.position);
        console.log(`Comparing positions: ${a.position}(${levelA}) vs ${b.position}(${levelB})`);
        return levelA - levelB;
      });

      console.log('Sorted cards:', sortedCards);

      // Create nodes with proper structure
      const createNode = (card: BusinessCard): OrgChartNode => ({
        id: card.id,
        name: card.name,
        position: card.position,
        email: card.email,
        children: [],
        cardDetails: card,
      });

      if (sortedCards.length === 0) {
        console.log('No cards found, returning empty structure');
        return {
          id: 'root',
          name: 'No Data',
          position: '',
          email: '',
          children: [],
        };
      }

      const root = createNode(sortedCards[0]);
      console.log('Created root node:', root);

      // Modified hierarchy building to ensure all cards are included
      const remainingCards = sortedCards.slice(1);
      console.log('Remaining cards to process:', remainingCards);

      // Group cards by level
      const levels: { [key: number]: BusinessCard[] } = {};
      remainingCards.forEach(card => {
        const level = getLevel(card.position);
        if (!levels[level]) levels[level] = [];
        levels[level].push(card);
      });

      console.log('Grouped cards by level:', levels);

      // Build hierarchy level by level
      Object.keys(levels).sort().forEach(levelStr => {
        const level = parseInt(levelStr);
        const cardsInLevel = levels[level];
        console.log(`Processing level ${level} with cards:`, cardsInLevel);

        cardsInLevel.forEach(card => {
          const node = createNode(card);
          // Find appropriate parent
          let parentNode = root;
          for (let i = level - 1; i >= 1; i--) {
            const potentialParents = levels[i] || [];
            if (potentialParents.length > 0) {
              // Find the parent with the fewest children
              const parent = potentialParents.reduce((a, b) => {
                const aNode = findNode(root, a.id);
                const bNode = findNode(root, b.id);
                return (aNode?.children.length || 0) < (bNode?.children.length || 0) ? a : b;
              });
              const parentNodeInTree = findNode(root, parent.id);
              if (parentNodeInTree) {
                parentNode = parentNodeInTree;
                break;
              }
            }
          }
          parentNode.children.push(node);
          console.log(`Added node ${node.name} to parent ${parentNode.name}`);
        });
      });

      console.log('Final org structure:', root);
      return root;
    }
  }
}

// Helper function to find a node in the tree
function findNode(root: OrgChartNode, id: string): OrgChartNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
} 