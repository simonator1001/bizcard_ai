"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"

interface Contact {
  id: string
  name: string
  titleEn: string
  titleZh: string
  company: string
}

const OrgChartNode = ({ contact, subordinates, onNodeClick, isRoot = false }: { 
  contact: Contact
  subordinates: Contact[]
  onNodeClick: (contact: Contact) => void
  isRoot?: boolean 
}) => {
  return (
    <div className="flex flex-col items-center">
      <Card 
        className={`min-w-[300px] shadow-none cursor-pointer ${
          isRoot ? 'bg-purple-100' : 'bg-emerald-100'
        } rounded-xl border-0`}
        onClick={() => onNodeClick(contact)}
      >
        <CardContent className="py-3 px-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold">{contact.name}</h3>
            <p className="text-sm text-gray-600">
              {contact.titleEn} {contact.titleZh && `/ ${contact.titleZh}`}
            </p>
          </div>
        </CardContent>
      </Card>
      {subordinates.length > 0 && (
        <>
          <div className="w-px h-28 bg-gray-300" />
          <div className="relative flex">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gray-300" />
            <div className="flex gap-40">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={[]}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const handleNodeClick = (contact: Contact) => {
    console.log("Clicked:", contact)
  }

  const mockData: Contact = {
    id: '1',
    name: 'Tai Hing Group Holdings Limited',
    titleEn: '',
    titleZh: '太興環球發展有限公司',
    company: 'Tai Hing'
  }

  const mockSubordinates: Contact[] = [
    {
      id: '2',
      name: 'Christina Tang',
      titleEn: 'Deputy General Manager',
      titleZh: '副總監',
      company: 'Tai Hing'
    }
  ]

  return (
    <div className="p-8 min-h-screen flex items-center justify-center">
      <OrgChartNode 
        contact={mockData} 
        subordinates={mockSubordinates} 
        onNodeClick={handleNodeClick}
        isRoot={true}
      />
    </div>
  )
} 