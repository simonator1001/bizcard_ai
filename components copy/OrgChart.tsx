'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface Contact {
  id: string
  name: string
  title: string
  company: string
  email: string
  reportsTo?: string
  imageUrl?: string
}

interface BusinessCard {
  id: string
  name: string
  nameZh?: string
  title: string
  company: string
  companyZh?: string
  email: string
  image_url?: string
  reports_to?: string
  department?: string
  departmentZh?: string
}

interface OrgChartNodeProps {
  contact: Contact
  subordinates: Contact[]
  onNodeClick: (contact: Contact) => void
  allCards: BusinessCard[]
}

const OrgChartNode = ({ contact, subordinates, onNodeClick, allCards }: OrgChartNodeProps) => {
  console.log("Rendering node:", contact)
  console.log("All cards available to node:", allCards)

  // Find subordinates for the current node
  const nodeSubordinates = allCards.filter(card => {
    const isSubordinate = card.reports_to === contact.id
    console.log(`Checking if ${card.name} reports to ${contact.name}:`, isSubordinate)
    return isSubordinate
  })
  
  console.log("Found subordinates for", contact.name, ":", nodeSubordinates)

  return (
    <div className="flex flex-col items-center min-w-fit">
      <Card 
        className="w-72 bg-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
        onClick={() => onNodeClick(contact)}
      >
        <CardContent className="p-6 flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/20">
            {contact.imageUrl ? (
              <AvatarImage src={contact.imageUrl} alt={contact.name} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {contact.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
          <h3 className="text-xl font-bold text-gray-800 text-center">{contact.name}</h3>
          <Badge variant="secondary" className="mt-2 mb-1">{contact.title}</Badge>
          <p className="text-sm text-gray-500 text-center">{contact.email}</p>
        </CardContent>
      </Card>
      {nodeSubordinates.length > 0 && (
        <>
          <div className="w-px h-12 bg-gray-300" />
          <div className="relative flex flex-col items-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gray-300" />
            <div className="flex gap-12 justify-center">
              {nodeSubordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={{
                    id: subordinate.id,
                    name: subordinate.name,
                    title: subordinate.title,
                    company: subordinate.company,
                    email: subordinate.email,
                    imageUrl: subordinate.image_url,
                    reportsTo: subordinate.reports_to
                  }}
                  subordinates={[]}
                  onNodeClick={onNodeClick}
                  allCards={allCards}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface OrgChartProps {
  cards: BusinessCard[]
  selectedCompany: string
}

export const OrgChart = ({ cards, selectedCompany }: OrgChartProps) => {
  const handleNodeClick = (contact: Contact) => {
    console.log("Clicked:", contact)
  }

  // Create a hierarchy based on titles
  const titleHierarchy: Record<string, number> = {
    "Director": 1,
    "General Manager": 1,
    "Senior Business Manager": 1,
    "Assistant General Manager": 2,
    "Senior Manager": 2,
    "Senior Marketing Manager": 2,
    "Senior Manager, Promotions": 2,
    "Business Manager": 2,
    "Assistant Manager": 3,
    "Marketing Manager": 3,
    "Manager": 3
  }

  // Normalize email for comparison
  const normalizeEmail = (email: string) => email.toLowerCase().trim()

  // Group cards by email and select the most senior title for each person
  const uniqueCards = Object.values(
    cards.reduce<Record<string, BusinessCard>>((acc, card) => {
      const email = normalizeEmail(card.email)
      const existingCard = acc[email]
      
      if (!existingCard) {
        acc[email] = card
        return acc
      }

      const existingLevel = titleHierarchy[existingCard.title] || 999
      const currentLevel = titleHierarchy[card.title] || 999

      // Keep the card with the more senior title (lower level number)
      if (currentLevel < existingLevel) {
        acc[email] = card
      }

      return acc
    }, {})
  )

  // Sort by hierarchy level
  const sortedCards = uniqueCards.sort((a, b) => {
    const levelA = titleHierarchy[a.title] || 999
    const levelB = titleHierarchy[b.title] || 999
    return levelA - levelB
  })

  // Set up reporting relationships based on title hierarchy
  const cardsWithReporting = sortedCards.map((card, index) => {
    const cardLevel = titleHierarchy[card.title] || 999
    
    // Find the first card with a higher level (lower number) to report to
    const manager = sortedCards.find((potentialManager, managerIndex) => {
      const managerLevel = titleHierarchy[potentialManager.title] || 999
      return managerIndex < index && managerLevel < cardLevel
    })

    return {
      ...card,
      reports_to: manager?.id
    }
  })

  // If no cards for the selected company
  if (cardsWithReporting.length === 0) {
    return (
      <div className="flex flex-col items-center gap-8 p-8">
        <div>No organization structure found for {selectedCompany}</div>
      </div>
    )
  }

  // Find root nodes (cards with no reports_to)
  const rootCards = cardsWithReporting.filter(card => !card.reports_to)

  // If there's only one root, use it as the root node
  // If there are multiple roots, create a virtual root node
  const rootNode: Contact = rootCards.length === 1 ? {
    id: rootCards[0].id,
    name: rootCards[0].name,
    title: rootCards[0].title,
    company: rootCards[0].company,
    email: rootCards[0].email,
    imageUrl: rootCards[0].image_url
  } : {
    id: 'virtual-root',
    name: selectedCompany,
    title: 'Company',
    company: selectedCompany,
    email: '',
    imageUrl: ''
  }

  // If using virtual root, make all root cards report to it
  const finalCards = rootCards.length === 1 ? cardsWithReporting : cardsWithReporting.map(card => {
    if (rootCards.some(root => root.id === card.id)) {
      return { ...card, reports_to: 'virtual-root' }
    }
    return card
  })

  return (
    <div className="w-full h-[calc(100vh-16rem)] p-8">
      <ScrollArea className="h-full w-full rounded-md border">
        <div className="min-w-full min-h-full flex flex-col items-center justify-start p-8">
          <div className="relative">
            <OrgChartNode 
              contact={rootNode}
              subordinates={[]}
              onNodeClick={handleNodeClick}
              allCards={finalCards}
            />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
} 