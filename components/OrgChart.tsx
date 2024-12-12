'use client'

import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface BusinessCard {
  id: string
  name: string
  title: string
  company: string
  email: string
  image_url?: string
  reports_to?: string
  department?: string
}

interface OrgChartProps {
  cards: BusinessCard[]
  selectedCompany: string
}

interface OrgChartNodeProps {
  card: BusinessCard
  allCards: BusinessCard[]
  onNodeClick: (card: BusinessCard) => void
}

const OrgChartNode: React.FC<OrgChartNodeProps> = ({ card, allCards, onNodeClick }) => {
  const subordinates = allCards.filter(c => c.reports_to === card.id)
  const initials = card.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="flex flex-col items-center min-w-fit">
      <Card 
        className="w-72 bg-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
        onClick={() => onNodeClick(card)}
      >
        <CardContent className="p-6 flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold text-gray-800 text-center">{card.name}</h3>
          <Badge variant="secondary" className="mt-2 mb-1">{card.title}</Badge>
          {card.department && (
            <span className="text-sm text-gray-500">{card.department}</span>
          )}
        </CardContent>
      </Card>

      {subordinates.length > 0 && (
        <>
          <div className="w-px h-8 bg-gray-300" />
          <div className="flex gap-8">
            {subordinates.map(subordinate => (
              <OrgChartNode
                key={subordinate.id}
                card={subordinate}
                allCards={allCards}
                onNodeClick={onNodeClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function OrgChart({ cards, selectedCompany }: OrgChartProps) {
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)

  const companyCards = cards.filter(card => card.company === selectedCompany)
  const rootCards = companyCards.filter(card => !card.reports_to)

  if (companyCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No organization data available</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md border">
      <div className="min-w-full min-h-full flex flex-col items-center p-8">
        {rootCards.map(card => (
          <OrgChartNode
            key={card.id}
            card={card}
            allCards={companyCards}
            onNodeClick={setSelectedCard}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
} 