'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { BusinessCard } from '@/types/business-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessCardDialog } from '../cards/BusinessCardDialog';
import { OrgChartNode } from './OrgChartNode';

type ViewMode = 'tree' | 'list';

export function OrgChartView() {
  const { cards } = useBusinessCards();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
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

  // Find the root contact (person with no manager or highest in hierarchy)
  const getRootContact = (contacts: BusinessCard[]): BusinessCard | null => {
    // For now, just return the first contact
    // In a real app, you'd use a proper hierarchy field
    return contacts[0] || null;
  };

  // Get subordinates for a given contact
  const getSubordinates = (contacts: BusinessCard[], managerId: string): BusinessCard[] => {
    // For now, just return other contacts
    // In a real app, you'd use a proper reports_to field
    return contacts.filter(contact => contact.id !== managerId);
  };

  const handleNodeClick = (data: BusinessCard) => {
    setSelectedCard(data);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Organization Chart</h2>
        <div className="flex items-center gap-4">
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
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">Tree</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCompanyData && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{selectedCompanyData.name}</CardTitle>
            <CardDescription>{selectedCompanyData.contacts.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className={`flex justify-center min-w-max p-8`}>
                {getRootContact(selectedCompanyData.contacts) && (
                  <OrgChartNode
                    contact={getRootContact(selectedCompanyData.contacts)!}
                    subordinates={getSubordinates(selectedCompanyData.contacts, getRootContact(selectedCompanyData.contacts)!.id)}
                    viewMode={viewMode}
                    onNodeClick={handleNodeClick}
                  />
                )}
              </div>
            </ScrollArea>
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