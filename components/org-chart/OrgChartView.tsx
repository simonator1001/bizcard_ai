'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { BusinessCard } from '@/types/business-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessCardDialog } from '../cards/BusinessCardDialog';
import { OrgChart } from './OrgChart';
import { RawNodeDatum } from 'react-d3-tree';
import { OrgChartService } from '@/lib/org-chart-service';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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

  // Initialize selectedCompany to the first company only once
  const [selectedCompany, setSelectedCompany] = useState<string>(() => companies[0]?.id || '');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [orgChartData, setOrgChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()));
  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  useEffect(() => {
    if (!selectedCompanyData) return;
    setLoading(true);
    const safeContacts = selectedCompanyData.contacts.map(card => ({
      id: card.id,
      name: card.name || '',
      title: card.title || '',
      company: card.company || '',
      email: card.email || '',
    }));
    OrgChartService.analyzeRelationships(safeContacts)
      .then((tree) => setOrgChartData(tree))
      .finally(() => setLoading(false));
  }, [selectedCompany]);

  const handleNodeClick = (nodeData: any) => {
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
        <div className="flex flex-col gap-2 w-[240px]">
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full z-[100000]">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto p-0 z-[100000] border border-muted-foreground/10 shadow-lg bg-white">
              <div className="sticky top-0 z-10 bg-background px-2 pt-2 pb-1 border-b border-muted-foreground/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    placeholder="Search company..."
                    className="pl-10 pr-3 py-2 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {filteredCompanies.length === 0 ? (
                <div className="px-4 py-2 text-muted-foreground text-sm">No companies found</div>
              ) : (
                filteredCompanies.map((company) => (
              <SelectItem key={company.id} value={company.id} className="truncate">
                {company.name}
              </SelectItem>
                ))
              )}
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
            {loading ? (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Loading org chart...
              </div>
            ) : orgChartData ? (
                <OrgChart
                  data={orgChartData}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  No organization data available
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCard && (
        <BusinessCardDialog
          card={selectedCard}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onEdit={(card) => {
            setShowDetails(false);
          }}
          onDelete={(id) => {
            setShowDetails(false);
          }}
        />
      )}
    </div>
  );
} 