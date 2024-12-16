import { Card, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'

interface BusinessCard {
  id: string
  name: string
  name_en: string
  company: string
  company_en: string
  position: string
  position_en: string
  email: string
  phone: string
  description: string
  imageUrl: string
}

interface ListViewProps {
  data: BusinessCard[]
  onCardClick: (card: BusinessCard) => void
}

export function ListView({ data, onCardClick }: ListViewProps) {
  return (
    <div className="space-y-4">
      {data.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            className="hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => onCardClick(card)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">
                        {card.name || card.name_en}
                        {card.name && card.name_en && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({card.name_en})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {card.position || card.position_en}
                        {card.position && card.position_en && (
                          <span className="ml-2">({card.position_en})</span>
                        )}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {card.company || card.company_en}
                        {card.company && card.company_en && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({card.company_en})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{card.email}</p>
                  <p>{card.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
} 