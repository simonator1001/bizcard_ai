'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { BusinessCard } from '@/types/business-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessCardDialog } from '../cards/BusinessCardDialog';
import { OrgChart } from './OrgChart';
import { RawNodeDatum } from 'react-d3-tree';

interface NodeData extends RawNodeDatum {
  name: string;
  position?: string;
  email?: string;
  level?: 'executive' | 'manager' | 'staff';
  children?: NodeData[];
  __rd3t?: {
    id: string;
    depth: number;
    collapsed: boolean;
  };
}

export function OrgChartView() {
  const { cards } = useBusinessCards();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);

  // Group cards by company
  const companiesMap = new Map<string, BusinessCard[]>();
  cards.forEach(card => {
    if (card.company) {
      const group = companiesMap.get(card.company) || [];
      group.push(card);
      companiesMap.set(card.company, group);
    }
  });

  const companies = Array.from(companiesMap.entries()).map(([name, cards]) => ({
    id: name,
    name,
    contacts: cards,
  }));

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  // Convert BusinessCard[] to NodeData structure
  const convertToOrgChartData = (contacts: BusinessCard[]): NodeData | null => {
    // Find the root (CEO/highest position)
    const root = contacts.find(c => 
      c.title?.toLowerCase().includes('ceo') ||
      c.title?.toLowerCase().includes('president') ||
      c.title?.toLowerCase().includes('founder')
    ) || contacts[0];

    if (!root) return null;

    const getLevel = (title: string = ''): NodeData['level'] => {
      title = title.toLowerCase();
      if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
        return 'executive';
      }
      if (title.includes('manager') || title.includes('director') || title.includes('head')) {
        return 'manager';
      }
      return 'staff';
    };

    const buildNode = (card: BusinessCard): NodeData => ({
      name: card.name || '',
      position: card.title || '',
      email: card.email || '',
      level: getLevel(card.title),
      children: contacts
        .filter(c => c.id !== card.id)
        .map(c => buildNode(c)),
      __rd3t: {
        depth: 0,
        id: card.id,
        collapsed: false,
      }
    });

    return buildNode(root);
  };

  const handleNodeClick = (nodeData: NodeData) => {
    const card = cards.find(c => c.name === nodeData.name && c.title === nodeData.position);
    if (card) {
      setSelectedCard(card);
      setShowDetails(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Organization Chart</h2>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCompanyData && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{selectedCompanyData.name}</CardTitle>
            <CardDescription>{selectedCompanyData.contacts.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const orgChartData = convertToOrgChartData(selectedCompanyData.contacts);
              return orgChartData ? (
                <OrgChart
                  data={orgChartData}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  No organization data available
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {selectedCard && (
        <BusinessCardDialog
          card={selectedCard}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onEdit={(card) => {
            // Handle edit
            setShowDetails(false);
          }}
          onDelete={(id) => {
            // Handle delete
            setShowDetails(false);
          }}
        />
      )}
    </div>
  );
} 