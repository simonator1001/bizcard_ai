'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { BusinessCard } from '@/types/business-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BusinessCardDialog } from '../cards/BusinessCardDialog';
import { OrgChart } from './OrgChart';
import { RawNodeDatum } from 'react-d3-tree';
import { OrgChartService } from '@/lib/org-chart-service';
import { CompanySearch } from './CompanySearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Users, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [currentView, setCurrentView] = useState('chart');

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

  const handleRefresh = () => {
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
  };

  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Export org chart');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Organization Chart</h2>
          <p className="text-muted-foreground mt-1">Visualize company structure and hierarchies</p>
        </div>
        <div className="w-full sm:w-[280px]">
          <CompanySearch
            label=""
            placeholder="Search and select company..."
            className="w-full"
            companies={companies.map(c => ({ value: c.id, label: c.name }))}
            value={selectedCompany}
            onChange={setSelectedCompany}
          />
        </div>
      </div>

      {selectedCompanyData ? (
        <Card className="border-border/40 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-background to-muted/30 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center">
                {selectedCompanyData.name}
                <Badge variant="outline" className="ml-2 bg-primary/10 hover:bg-primary/20 border-none text-primary">
                  <Users className="h-3 w-3 mr-1" /> {selectedCompanyData.contacts.length}
                </Badge>
              </CardTitle>
              <CardDescription>Organization structure visualization</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleExport}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Tabs defaultValue="chart" className="w-full" onValueChange={setCurrentView}>
            <div className="px-6 border-b">
              <TabsList className="-mb-px mt-1">
                <TabsTrigger value="chart" className="data-[state=active]:bg-background">Chart View</TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-background">List View</TabsTrigger>
              </TabsList>
            </div>
            <CardContent className="p-0 max-h-[700px]">
              <TabsContent value="chart" className="m-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[600px] bg-muted/5">
                    <Skeleton className="h-[80px] w-[80px] rounded-full" />
                    <Skeleton className="h-4 w-[200px] mt-4" />
                    <Skeleton className="h-3 w-[160px] mt-2" />
                    <p className="text-muted-foreground mt-6">Analyzing organization structure...</p>
                  </div>
                ) : orgChartData ? (
                  <div className="h-[600px]">
                    <OrgChart
                      data={orgChartData}
                      onNodeClick={handleNodeClick}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[600px] bg-muted/5">
                    <div className="bg-muted/20 rounded-full p-6">
                      <Users className="h-12 w-12 text-muted-foreground/60" />
                    </div>
                    <h3 className="mt-6 text-xl font-medium">No organization data available</h3>
                    <p className="text-muted-foreground mt-2">Try adding more contacts or refreshing the chart</p>
                    <Button onClick={handleRefresh} className="mt-6">
                      <RefreshCw className="h-4 w-4 mr-2" /> Generate Chart
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="list" className="m-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-6 space-y-4">
                    {selectedCompanyData.contacts.map((contact, index) => (
                      <Card key={contact.id || index} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{contact.name}</CardTitle>
                              <CardDescription>{contact.title || 'No title'}</CardDescription>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setSelectedCard(contact);
                                setShowDetails(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted/20 rounded-full p-6">
              <Users className="h-12 w-12 text-muted-foreground/60" />
            </div>
            <h3 className="mt-6 text-xl font-medium">No company selected</h3>
            <p className="text-muted-foreground mt-2">Select a company to view its organization chart</p>
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