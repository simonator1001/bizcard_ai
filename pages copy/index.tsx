'use client'

import { Layout } from '@/components/layout'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scanner } from '@/components/scanner'
import { CardDatabase } from '@/components/card-database'
import { OrgChart } from '@/components/org-chart'
import { NewsSection } from '@/components/news-section'
import { ProIcon } from '@/components/pro-icon'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanLine, LayoutList, Network, Newspaper, Star, Settings, Bookmark } from 'lucide-react'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('scan')

  const tabs = [
    { icon: <ScanLine className="h-8 w-8 mb-2" />, label: "Scan", value: "scan" },
    { icon: <LayoutList className="h-8 w-8 mb-2" />, label: "Manage", value: "manage" },
    { icon: <Network className="h-8 w-8 mb-2" />, label: "Org Chart", value: "orgchart" },
    { icon: <Newspaper className="h-8 w-8 mb-2" />, label: "News", value: "news" },
    { icon: <Bookmark className="h-8 w-8 mb-2" />, label: "Saved", value: "saved-news" },
    { icon: <Star className="h-8 w-8 mb-2" />, label: "Pro", value: "pro" },
    { icon: <Settings className="h-8 w-8 mb-2" />, label: "Settings", value: "settings" },
  ]

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm py-6 px-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Simon.AI BizCard Digital Archive
        </h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="scan" className="h-full p-8">
            <Scanner />
          </TabsContent>

          <TabsContent value="manage" className="h-full p-8">
            <CardDatabase />
          </TabsContent>

          <TabsContent value="orgchart" className="h-full p-8">
            <OrgChart />
          </TabsContent>

          <TabsContent value="news" className="h-full p-8">
            <NewsSection />
          </TabsContent>

          <TabsContent value="pro" className="h-full p-8">
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>Get access to advanced features</CardDescription>
              </CardHeader>
              <CardContent>
                <ProIcon />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="h-full p-8">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your preferences</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t px-8 py-6">
        <div className="flex justify-around items-center">
          {tabs.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="lg"
              className={`flex flex-col items-center ${activeTab === item.value ? 'text-primary' : ''}`}
              onClick={() => setActiveTab(item.value)}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </footer>
    </div>
  )
}