import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown } from 'lucide-react'

interface BusinessCard {
  id: string
  name: string
  position: string
  company: string
  email: string
  phone: string
  description: string
  imageUrl: string
  reportsTo?: string
}

interface OrgChartNodeProps {
  contact: BusinessCard
  subordinates: BusinessCard[]
  onNodeClick: (contact: BusinessCard) => void
  allCards: BusinessCard[]
}

function OrgChartNode({ contact, subordinates, onNodeClick, allCards }: OrgChartNodeProps) {
  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        className="w-64 bg-white rounded-xl shadow-sm cursor-pointer transition-all duration-300"
        style={{ 
          background: 'linear-gradient(145deg, #f5f7fa 0%, #e4e7eb 100%)',
        }}
        onClick={() => onNodeClick(contact)}
      >
        <div className="p-4 flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative mb-3"
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={contact.imageUrl} alt={contact.name} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-semibold">
                {contact.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-800 text-center">{contact.name}</h3>
          <p className="text-sm text-gray-600 text-center">{contact.position}</p>
          <p className="text-xs text-gray-500 text-center mt-1">{contact.email}</p>
        </div>
      </motion.div>

      {subordinates.length > 0 && (
        <motion.div 
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="w-px h-8 bg-gray-200" />
          <div className="relative flex">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gray-200" />
            <div className="flex gap-8">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={getSubordinates(subordinate.id, allCards)}
                  onNodeClick={onNodeClick}
                  allCards={allCards}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function getSubordinates(managerId: string, cards: BusinessCard[]): BusinessCard[] {
  return cards.filter(card => card.reportsTo === managerId)
}

interface OrgChartViewProps {
  data: BusinessCard[]
}

export function OrgChartView({ data }: OrgChartViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('placeholder')
  const companies = Array.from(new Set(data.map(card => card.company))).filter(Boolean)

  const getRootNode = (company: string, cards: BusinessCard[]): BusinessCard | undefined => {
    if (company === 'placeholder') return undefined
    return cards.find(card => card.company === company && !card.reportsTo)
  }

  const handleNodeClick = (contact: BusinessCard) => {
    console.log("Clicked:", contact)
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Organization Chart</h2>
            <Select 
              value={selectedCompany} 
              onValueChange={setSelectedCompany}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue>
                  {selectedCompany === 'placeholder' ? 'Select a company' : selectedCompany}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder">Select a company</SelectItem>
                {companies.map(company => (
                  company && (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence mode="wait">
            {selectedCompany !== 'placeholder' ? (
              <motion.div 
                key="org-chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                {getRootNode(selectedCompany, data) && (
                  <OrgChartNode
                    contact={getRootNode(selectedCompany, data)!}
                    subordinates={getSubordinates(getRootNode(selectedCompany, data)!.id, data)}
                    onNodeClick={handleNodeClick}
                    allCards={data}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <ChevronDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500">
                  Select a company to view its organization chart
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  )
}

export default OrgChartView 