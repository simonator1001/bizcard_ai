"use client";

import { SearchBar } from "@/components/SearchBar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ScanLine, 
  LayoutList, 
  Network, 
  Newspaper, 
  Settings, 
  LayoutGrid,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { useAuth } from '@/lib/auth-context';
import { BusinessCard } from '@/types/business-card';
import { ManageCardsView } from '@/components/cards/ManageCardsView';
import { SettingsTab } from '@/components/shared/SettingsTab';
import { NewsView } from '@/components/news/NewsView';
import { ChatInterface } from '@/components/chat/ChatInterface';

type NavigationItem = {
  title: string;
  icon: LucideIcon;
  type?: never;
} | {
  type: "separator";
  title?: never;
  icon?: never;
};

const navigationItems: NavigationItem[] = [
  { title: "Scan", icon: ScanLine },
  { title: "Manage", icon: LayoutGrid },
  { type: "separator" },
  { title: "Network", icon: Network },
  { title: "News", icon: Newspaper },
  { title: "Settings", icon: Settings },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("scan");
  const { user } = useAuth();

  const handleSearch = (value: string) => {
    // Implement search functionality
    console.log("Searching for:", value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Business Cards</h1>
            {user && (
              <Button variant="outline" size="sm">
                <ScanLine className="mr-2 h-4 w-4" />
                Scan New Card
              </Button>
            )}
          </div>
          
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search cards..."
            className="w-full max-w-3xl"
          />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
              {navigationItems.map((item, index) => (
                item.type === "separator" ? (
                  <div key={index} className="border-r border-gray-200" />
                ) : (
                  <TabsTrigger
                    key={item.title.toLowerCase()}
                    value={item.title.toLowerCase()}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </TabsTrigger>
                )
              ))}
            </TabsList>

            <TabsContent value="scan">
              <Card>
                <CardContent className="p-6">
                  <ChatInterface />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage">
              <ManageCardsView setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="network">
              <Card>
                <CardContent className="p-6">
                  Network content coming soon...
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="news">
              <NewsView />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
} 