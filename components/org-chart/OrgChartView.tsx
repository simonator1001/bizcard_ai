import { useState, useCallback, useEffect, memo, useMemo } from 'react'
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
import { BusinessCardDialog } from '@/components/cards/BusinessCardDialog'

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

// Add these styles at the top of the file
const nodeStyles = {
  topLevel: 'bg-gradient-to-br from-blue-50 to-blue-100',
  midLevel: 'bg-gradient-to-br from-purple-50 to-purple-100',
  staffLevel: 'bg-gradient-to-br from-gray-50 to-gray-100',
  common: 'transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl'
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

// Update the getNodeStyle function
const getNodeStyle = (position?: string): string => {
  if (!position) return nodeStyles.staffLevel;
  
  const positionLower = position.toLowerCase();
  if (positionLower.includes('ceo') || 
      positionLower.includes('chief') || 
      positionLower.includes('president') || 
      positionLower.includes('director')) {
    return nodeStyles.topLevel;
  } else if (positionLower.includes('manager') || 
             positionLower.includes('lead') || 
             positionLower.includes('head')) {
    return nodeStyles.midLevel;
  }
  return nodeStyles.staffLevel;
}

// Custom Node Component
const CustomNode = memo(({ data }: { data: BusinessCard }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const nodeStyle = getNodeStyle(data.position)
  const avatarSize = getNodeSize(data.position)
  
  // Get the display title (prefer Chinese if available)
  const displayTitle = data.title_zh || data.title || data.position
  
  return (
    <div className="group"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-3 !h-3"
        style={{ transition: 'all 0.3s ease' }}
      />
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          rounded-xl p-4 min-w-[200px] cursor-pointer
          ${nodeStyle} ${nodeStyles.common}
          ${isHovered ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        `}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center space-x-4">
          <div className={`relative ${avatarSize}`}>
            <Avatar className={`
              border-2 transition-colors duration-300
              ${isHovered ? 'border-blue-400' : 'border-gray-200'}
              ${avatarSize}
            `}>
              <AvatarImage src={data.imageUrl} alt={data.name} />
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200">
                {data.name?.substring(0, 2) || 'NA'}
              </AvatarFallback>
            </Avatar>
            {getPositionIcon(data.position)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {data.name || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {data.position}
            </div>
            <div className="mt-2 text-xs text-gray-400 truncate">
              {displayTitle}
            </div>
          </div>
        </div>
      </motion.div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400 !w-3 !h-3"
        style={{ transition: 'all 0.3s ease' }}
      />

      <BusinessCardDialog 
        open={showDetails}
        onOpenChange={setShowDetails}
        card={data}
        mode="view"
      />
    </div>
  )
})

// Helper function to get position icons
function getPositionIcon(position?: string) {
  const iconClass = "absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
  
  if (!position) return null;
  const pos = position.toLowerCase();
  
  if (pos.includes('ceo') || pos.includes('chief')) {
    return <div className={iconClass}>👑</div>
  }
  if (pos.includes('director')) {
    return <div className={iconClass}>🎯</div>
  }
  if (pos.includes('manager')) {
    return <div className={iconClass}>👨‍💼</div>
  }
  if (pos.includes('engineer') || pos.includes('developer')) {
    return <div className={iconClass}>👨‍💻</div>
  }
  return null;
}

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

// Add this interface at the top with other interfaces
interface OrgChartViewProps {
  data: BusinessCard[]
}

export function OrgChartView({ data }: OrgChartViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('placeholder')
  const [searchQuery, setSearchQuery] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize getCompanyCards to prevent unnecessary recreations
  const getCompanyCards = useCallback((companyName: string) => {
    if (!companyName || companyName === 'placeholder') {
      return [];
    }

    return data.filter(card => {
      // Add null checks and logging
      console.log('Filtering card:', {
        id: card.id,
        company: card.company,
        companyName,
        matches: card.company?.toLowerCase() === companyName?.toLowerCase()
      });

      // Safe null check before toLowerCase
      return card.company && 
             companyName && 
             card.company.toLowerCase() === companyName.toLowerCase();
    });
  }, [data]);

  // Memoize companies list
  const companies = useMemo(() => {
    // Get unique companies and filter out any null/undefined values
    const uniqueCompanies = Array.from(new Set(
      data
        .map(card => card.company)
        .filter((company): company is string => !!company) // Type guard to ensure non-null
    )).sort();
    
    // Apply search filter if there's a query
    if (!searchQuery) return uniqueCompanies;
    
    return uniqueCompanies.filter(company => 
      company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Add the missing updateOrgChart function
  const updateOrgChart = useCallback(async (company: string) => {
    if (company === 'placeholder') {
      setNodes([])
      setEdges([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Updating org chart for:', company)
      const companyCards = getCompanyCards(company)
      
      if (!companyCards.length) {
        console.log('⚠️ No cards found for company:', company)
        setError('No data available for this company')
        return
      }

      // Analyze relationships
      const cardsWithRelationships = await analyzeOrgStructure(companyCards)
      console.log('📊 Cards with relationships:', cardsWithRelationships)

      // Create flow elements using the hierarchical layout
      const { nodes: newNodes, edges: newEdges } = createHierarchicalLayout(cardsWithRelationships)

      console.log('🎨 Setting flow elements:', { nodes: newNodes, edges: newEdges })
      setNodes(newNodes)
      setEdges(newEdges)

    } catch (err) {
      console.error('❌ Error updating org chart:', err)
      setError('Failed to generate organization chart')
    } finally {
      setIsLoading(false)
    }
  }, [getCompanyCards, setNodes, setEdges])

  // Remove the duplicate useEffect
  useEffect(() => {
    if (selectedCompany !== 'placeholder') {
      updateOrgChart(selectedCompany);
    }
  }, [selectedCompany, updateOrgChart]);

  // Debug logging
  useEffect(() => {
    console.log('Component mounted with data:', {
      totalCards: data.length,
      companies: companies,
      selectedCompany,
    });
  }, [data, companies, selectedCompany]);

  return (
    <div className="space-y-6">
      {/* Search and Company Select */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-[300px]">
            <Select
              value={selectedCompany}
              onValueChange={setSelectedCompany}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="placeholder">Select a company</SelectItem>
                  {companies.map(company => (
                    company && (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    )
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[600px] border rounded-lg bg-white">
        <ReactFlowProvider>
          {selectedCompany !== 'placeholder' ? (
            isLoading ? (
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
                fitViewOptions={{ padding: 0.5 }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { 
                    stroke: '#94a3b8', 
                    strokeWidth: 2,
                    strokeDasharray: '5,5'
                  },
                  markerEnd: {
                    type: 'arrowclosed',
                    width: 20,
                    height: 20,
                    color: '#94a3b8',
                  },
                }}
              >
                <Background color="#f0f0f0" gap={16} variant="dots" />
                <Controls />
              </ReactFlow>
            )
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
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default OrgChartView 