'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Network, Users, Building2, Mail, Phone, Linkedin, ScanLine, LayoutList, UserCircle, Settings, ZoomIn, ZoomOut, ChevronRight, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/router'
import { BusinessCard } from '@/types/business-card'
import dynamic from 'next/dynamic'

interface TreeNode {
  card: BusinessCard
  children: TreeNode[]
  isExpanded: boolean
}

const levelColors = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
]

// Replace the separate dynamic imports with a single import
const ZoomPanPinch = dynamic(
  () => import('react-zoom-pan-pinch').then((mod) => ({
    default: ({ children, ...props }) => (
      <mod.TransformWrapper
        {...props}
        minScale={0.1}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}  // Allow movement beyond bounds
        wheel={{ wheelEnabled: true }}
        pinch={{ pinchEnabled: true }}
        doubleClick={{ disabled: true }}
      >
        {(utils) => (
          <>
            <div className="flex justify-end mb-2 gap-2">
              <Button variant="outline" size="icon" onClick={() => utils.zoomIn()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => utils.zoomOut()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => utils.resetTransform()}>
                Reset
              </Button>
            </div>
            <mod.TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                overflow: "visible"  // Allow content to overflow
              }}
            >
              {children}
            </mod.TransformComponent>
          </>
        )}
      </mod.TransformWrapper>
    )
  })),
  { ssr: false }
);

const ZoomableContent = ({ children }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-[600px] w-full">{children}</div>;
  }

  return (
    <ZoomPanPinch
      initialScale={1}
      initialPositionX={0}
      initialPositionY={0}
    >
      <div className="min-h-[600px] w-full">
        {children}
      </div>
    </ZoomPanPinch>
  );
};

export default function CompanyStructureCollapsible() {
  const router = useRouter()
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [activeTab, setActiveTab] = useState('org')
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const companies = useMemo(() => 
    Array.from(new Set(cards.map(card => card.company)))
      .filter(company => company && company.trim() !== ''),
    [cards]
  )

  const buildTree = (cards: BusinessCard[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    cards.forEach(card => {
      nodeMap.set(card.id, { card, children: [], isExpanded: true })
    })

    cards.forEach(card => {
      const node = nodeMap.get(card.id)!
      if (card.reportsTo) {
        const parentNode = nodeMap.get(cards.find(c => c.name === card.reportsTo)?.id || '')
        if (parentNode) {
          parentNode.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  useEffect(() => {
    if (selectedCompany) {
      const companyCards = cards.filter(card => card.company === selectedCompany)
      setTreeData(buildTree(companyCards))
    }
  }, [selectedCompany, cards])

  const toggleExpand = (nodeId: string) => {
    setTreeData(prevData => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.card.id === nodeId) {
            return { ...node, isExpanded: !node.isExpanded }
          }
          return { ...node, children: updateNode(node.children) }
        })
      }
      return updateNode(prevData)
    })
  }

  const renderTree = (nodes: TreeNode[]) => {
    return nodes.map(node => (
      <div key={node.card.id} className="ml-4">
        <div 
          className={`flex items-center gap-2 p-1 rounded-md cursor-pointer ${levelColors[node.card.level ? node.card.level - 1 : 0].bg} ${levelColors[node.card.level ? node.card.level - 1 : 0].text} ${levelColors[node.card.level ? node.card.level - 1 : 0].border} border`}
          onClick={() => toggleExpand(node.card.id)}
        >
          {node.children.length > 0 && (
            node.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">{node.card.name}</span>
          <span className="text-xs opacity-75">({node.card.title})</span>
        </div>
        {node.isExpanded && node.children.length > 0 && (
          <div className="ml-4 mt-1 border-l border-gray-300 pl-2">
            {renderTree(node.children)}
          </div>
        )}
      </div>
    ))
  }

  // Add navigation handler
  const handleNavigation = (tab: string) => {
    switch (tab) {
      case 'scan':
      case 'manage':
        router.push({
          pathname: '/',
          query: { tab }
        });
        break;
      case 'org':
        router.push('/org-chart-collapsible');
        break;
      case 'profile':
        // Handle profile navigation
        break;
      case 'settings':
        // Handle settings navigation
        break;
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-light text-gray-700">Collapsible View</h1>
                <p className="text-sm text-gray-500">Compact and expandable organization structure</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="gap-2 text-gray-600 border-gray-300">
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[300px] border-gray-200">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company} value={company || 'unknown'}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {company || 'Unknown Company'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {cards.length} Contacts
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {companies.length} Companies
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] rounded-md border border-gray-200 p-4">
              {selectedCompany ? (
                <ZoomableContent>
                  {renderTree(treeData)}
                </ZoomableContent>
              ) : (
                <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
                  <Users className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-light mb-2 text-gray-600">Select a Company</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a company to view its collapsible organizational structure
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="container mx-auto">
          <div className="flex justify-around items-center py-2">
            {[
              { id: 'scan', icon: ScanLine, label: 'Scan' },
              { id: 'manage', icon: LayoutList, label: 'Manage' },
              { id: 'org', icon: Building2, label: 'Org Chart' },
              { id: 'profile', icon: UserCircle, label: 'Profile' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="lg"
                  className={`flex flex-col items-center gap-1 ${
                    activeTab === item.id ? 'text-primary' : 'text-gray-500'
                  }`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </footer>

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Contact Details</DialogTitle>
            <DialogDescription className="text-gray-500">Information about the selected contact</DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <div className="grid gap-4 py-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedCard.image_url} alt={selectedCard.name} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">{selectedCard.name[0]}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="text-lg font-medium text-gray-800">{selectedCard.name}</h3>
                  <p className="text-sm text-gray-500">{selectedCard.title}</p>
                  <p className="text-sm font-medium text-gray-700">{selectedCard.company}</p>
                </div>
              </div>
              <div className="grid gap-3 p-4 rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{selectedCard.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{selectedCard.phone}</p>
                </div>
                {selectedCard.department && (
                  <Badge variant="outline" className="w-fit border-gray-300 text-gray-600">
                    {selectedCard.department}
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2 border-gray-300 text-gray-600"
                onClick={() => window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(selectedCard.name)}`, '_blank')}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Find on LinkedIn
              </Button>
            </div>
          )}
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
} 