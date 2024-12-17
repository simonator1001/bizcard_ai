import { useState, useCallback, useEffect, memo } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge,
  ConnectionLineType,
  Position,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { analyzeOrgStructure, testPerplexityAPI } from '@/lib/org-chart-analyzer'
import { Mail, Phone } from 'lucide-react'

interface BusinessCard {
  id: string
  name: string
  position: string      // Make this required, not optional
  title?: string        // Original English title from Supabase
  title_zh?: string     // Original Chinese title from Supabase
  company: string
  email: string
  phone: string
  imageUrl?: string
  reportsTo?: string
}

// Add node sizes based on seniority
const getNodeSize = (position?: string): string => {
  if (!position) return 'h-14 w-14' // Default size if no position
  
  const positionLower = position.toLowerCase()
  if (positionLower.includes('ceo') || positionLower.includes('chief') || positionLower.includes('president')) {
    return 'h-24 w-24' // Largest size for top executives
  } else if (positionLower.includes('director') || positionLower.includes('vp') || positionLower.includes('head')) {
    return 'h-20 w-20' // Large size for directors
  } else if (positionLower.includes('manager') || positionLower.includes('lead')) {
    return 'h-16 w-16' // Medium size for managers
  }
  return 'h-14 w-14' // Default size for other positions
}

// Custom Node Component
const CustomNode = memo(({ data }: { data: BusinessCard }) => {
  const [showDetails, setShowDetails] = useState(false)
  
  console.log('🎯 Rendering node with data:', {
    name: data.name,
    position: data.position,
    title: data.title,
    title_zh: data.title_zh,
    data
  });

  return (
    <div className="group">
      <Handle
        type="target"
        position={Position.Top}
        id={`target-${data.id}`}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`source-${data.id}`}
        style={{ background: '#555' }}
      />
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white rounded-lg shadow-md p-4 min-w-[180px] cursor-pointer border border-gray-200"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center space-x-3">
          <Avatar className={`border border-gray-200 ${getNodeSize(data.position)}`}>
            <AvatarImage src={data.imageUrl} alt={data.name} />
            <AvatarFallback>{data.name?.substring(0, 2) || 'NA'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{data.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{data.position}</div>
          </div>
        </div>
      </motion.div>

      {showDetails && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Business Card Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border border-gray-200">
                  <AvatarImage src={data.imageUrl} alt={data.name} />
                  <AvatarFallback>{data.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{data.name}</h3>
                  <p className="text-sm text-gray-500">{data.position}</p>
                  <p className="text-sm text-gray-500">{data.company}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>{data.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{data.phone}</span>
                </div>
                {data.description && (
                  <p className="text-sm mt-2">{data.description}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})

CustomNode.displayName = 'CustomNode'

// Define nodeTypes outside and memoize it with useMemo
const nodeTypes = {
  custom: CustomNode
} as const; // Use const assertion to ensure it never changes

// Add this function before createFlowElements
const getLevel = (position?: string): number => {
  if (!position) return 6; // Default level if no position
  
  const positionLower = position.toLowerCase();
  
  // Define position hierarchy
  const positionHierarchy = {
    level1: ['ceo', 'chief', 'president', 'founder', 'chairman', 'director', 'managing director'],
    level2: ['vp', 'vice president', 'head', 'general manager', 'gm', 'deputy director'],
    level3: ['manager', 'lead', 'supervisor', 'head of', 'team lead'],
    level4: ['senior', 'sr', 'principal', 'specialist', 'consultant'],
    level5: ['associate', 'junior', 'jr', 'assistant', 'trainee'],
  };

  // Check each level
  for (const [key, titles] of Object.entries(positionHierarchy)) {
    if (titles.some(title => 
      positionLower.includes(title) || 
      positionLower.includes(title) || 
      positionLower.startsWith(title + ' ') || 
      positionLower.endsWith(' ' + title)
    )) {
      return parseInt(key.replace('level', ''));
    }
  }

  return 6; // Default level for other positions
};

// Convert business cards to flow nodes and edges
const createFlowElements = (cards: BusinessCard[], company: string) => {
  console.log('Creating flow elements for cards:', cards.map(c => ({
    id: c.id,
    name: c.name,
    position: c.position,
    title: c.title,
    title_zh: c.title_zh
  })));
  
  const nodes: Node[] = []
  const edges: Edge[] = []
  const levelMap = new Map<string, number>();
  const xSpacing = 250
  const ySpacing = 150

  // Define getLevelFromReporting here, before it's used
  const getLevelFromReporting = (cardId: string, visited = new Set<string>()): number => {
    if (visited.has(cardId)) return 0;
    visited.add(cardId);
    
    const card = cards.find(c => c.id === cardId);
    if (!card || !card.reportsTo) return 0;
    
    return 1 + getLevelFromReporting(card.reportsTo, visited);
  };

  // Calculate levels
  cards.forEach(card => {
    const level = getLevelFromReporting(card.id);
    levelMap.set(card.id, level);
  });

  // Group cards by level
  const cardsByLevel = new Map<number, BusinessCard[]>();
  cards.forEach(card => {
    const level = levelMap.get(card.id) || 0;
    if (!cardsByLevel.has(level)) {
      cardsByLevel.set(level, []);
    }
    cardsByLevel.get(level)?.push(card);
  });

  // Create nodes with proper positioning
  cardsByLevel.forEach((levelCards, level) => {
    const y = level * ySpacing + 50;
    levelCards.forEach((card, index) => {
      const x = (index - (levelCards.length - 1) / 2) * xSpacing + 400;
      
      // Ensure all required data is passed to the node
      const node: Node = {
        id: card.id,
        type: 'custom',
        position: { x, y },
        data: {
          ...card,
          position: card.position || card.title || card.title_zh || 'No Position',
        },
      };
      
      // Debug log the node creation
      console.log('📌 Created node:', {
        id: node.id,
        name: node.data.name,
        position: node.data.position
      });
      
      nodes.push(node);
    });
  });

  // Create edges
  cards.forEach(card => {
    if (card.reportsTo) {
      edges.push({
        id: `e${card.id}-${card.reportsTo}`,
        source: card.reportsTo,
        target: card.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: '#94a3b8',
        },
      });
    }
  });

  return { nodes, edges };
};

// Helper function to create hierarchical layout
const createHierarchicalLayout = (cards: BusinessCard[]) => {
  const nodeWidth = 250;
  const nodeHeight = 150;
  const levelSpacing = 200;
  
  // Create a map of cards by their IDs for quick lookup
  const cardMap = new Map(cards.map(card => [card.id, card]));
  
  // Group cards by their level in the hierarchy
  const levelGroups = new Map<number, BusinessCard[]>();
  
  // First pass: Assign levels to all cards
  cards.forEach(card => {
    let level = 0;
    let currentCard = card;
    
    // Traverse up the reporting chain to determine level
    while (currentCard.reportsTo && cardMap.get(currentCard.reportsTo)) {
      level++;
      currentCard = cardMap.get(currentCard.reportsTo)!;
    }
    
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(card);
  });
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Second pass: Create nodes with proper positioning
  levelGroups.forEach((cardsInLevel, level) => {
    const levelWidth = cardsInLevel.length * nodeWidth;
    const startX = -(levelWidth / 2);
    
    cardsInLevel.forEach((card, index) => {
      const xPos = startX + (index * nodeWidth) + (nodeWidth / 2);
      const yPos = level * levelSpacing;
      
      nodes.push({
        id: card.id,
        type: 'custom',
        position: { x: xPos, y: yPos },
        data: { ...card },
      });
      
      // Create edge if there's a reporting relationship
      if (card.reportsTo && cardMap.has(card.reportsTo)) {
        edges.push({
          id: `e${card.reportsTo}-${card.id}`,
          source: card.reportsTo,
          target: card.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }
    });
  });
  
  return { nodes, edges };
};

interface OrgChartViewProps {
  data: BusinessCard[]
}

export function OrgChartView({ data }: OrgChartViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('placeholder')
  const [searchTerm, setSearchTerm] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companies = Array.from(new Set(data.map(card => {
    console.log('Processing card company:', card.company);
    return card.company;
  }))).filter(Boolean);

  console.log('📋 Available companies:', companies);

  const filteredCompanies = companies.filter(company => 
    company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCompanyCards = useCallback((company: string) => {
    console.log('🏢 Getting cards for company:', company);
    console.log('📊 All available cards:', data);
    
    // Case-insensitive company matching
    const cards = data.filter(card => {
      const matches = card.company?.toLowerCase() === company.toLowerCase();
      console.log(`Checking card:`, {
        cardId: card.id,
        cardCompany: card.company,
        selectedCompany: company,
        matches
      });
      return matches;
    });
    
    console.log(`📇 Found ${cards.length} cards for ${company}:`, cards);
    return cards;
  }, [data]);

  const updateOrgChart = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    
    if (selectedCompany === 'placeholder') {
      console.log('No company selected, skipping analysis');
      return;
    }

    console.log('🔄 Starting org chart update for company:', selectedCompany);
    
    // Filter cards for selected company
    const companyCards = data.filter(card => {
      const matches = card.company === selectedCompany;
      console.log('Checking card:', {
        id: card.id,
        name: card.name,
        company: card.company,
        selectedCompany,
        matches,
        title: card.title,
        title_zh: card.title_zh,
        position: card.position
      });
      return matches;
    });

    if (companyCards.length === 0) {
      console.warn('⚠️ No cards found for company:', selectedCompany);
      return;
    }

    try {
      console.log('🤖 Sending to Perplexity for analysis...');
      const analyzedCards = await analyzeOrgStructure(companyCards);
      console.log('✅ Analysis results:', analyzedCards);

      const { nodes: newNodes, edges: newEdges } = createFlowElements(analyzedCards, selectedCompany);
      
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('❌ Error in updateOrgChart:', error);
      setError('Failed to update organization chart');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, data, setNodes, setEdges]);

  useEffect(() => {
    console.log('useEffect triggered with selectedCompany:', selectedCompany);
    updateOrgChart();
  }, [selectedCompany, updateOrgChart]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    console.log('Perplexity API Key available:', apiKey ? 'Yes' : 'No');
    if (!apiKey) {
      console.warn('No Perplexity API key found in environment variables');
    }
  }, []);

  useEffect(() => {
    console.log('🔄 OrgChartView mounted');
    console.log('📊 Initial data:', data);
  }, []);

  useEffect(() => {
    console.log('📊 Data updated:', {
      totalCards: data.length,
      sampleCard: data[0],
      companies: Array.from(new Set(data.map(card => card.company))).filter(Boolean)
    });
  }, [data]);

  useEffect(() => {
    async function testAPI() {
      console.log('🧪 Testing Perplexity API...');
      const working = await testPerplexityAPI();
      console.log('🧪 API Test Result:', working ? 'Working' : 'Failed');
    }
    testAPI();
  }, []);

  useEffect(() => {
    console.log('Raw data from Supabase:', data.map(card => ({
      id: card.id,
      name: card.name,
      title: card.title,       // From Supabase
      position: card.position, // What's actually used in frontend
      company: card.company
    })));
  }, [data]);

  return (
    <div className="h-[calc(100vh-280px)]">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Organization Chart</h2>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[280px]"
                />
              </div>
              <Select 
                value={selectedCompany} 
                onValueChange={(value) => {
                  console.log('🏢 Company selected:', value);
                  setSelectedCompany(value);
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue>
                    {selectedCompany === 'placeholder' ? 'Select a company' : selectedCompany}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <ScrollArea className="h-[200px]">
                    <SelectItem value="placeholder">Select a company</SelectItem>
                    {filteredCompanies.map(company => (
                      company && (
                        <SelectItem 
                          key={company} 
                          value={company}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                          {company}
                        </SelectItem>
                      )
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-[600px] border rounded-lg bg-white">
            {selectedCompany !== 'placeholder' ? (
              <ReactFlowProvider>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                      <p>Loading organization chart...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-500">
                      <p>{error}</p>
                    </div>
                  </div>
                ) : (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{
                      padding: 1,
                      minZoom: 0.5,
                      maxZoom: 1.5,
                    }}
                    minZoom={0.2}
                    maxZoom={1.5}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    defaultEdgeOptions={{
                      type: 'smoothstep',
                      animated: true,
                      style: { 
                        stroke: '#94a3b8', 
                        strokeWidth: 2,
                        strokeDasharray: '5,5'  // Add dashed line effect
                      },
                      markerEnd: {
                        type: 'arrowclosed',
                        width: 20,
                        height: 20,
                        color: '#94a3b8',
                      },
                    }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                  >
                    <Background color="#f0f0f0" gap={16} variant="dots" />
                    <Controls />
                  </ReactFlow>
                )}
              </ReactFlowProvider>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <ChevronDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg text-gray-500">
                    Select a company to view its organization chart
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrgChartView 