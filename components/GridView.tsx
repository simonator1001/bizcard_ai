import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface GridViewProps {
  data: BusinessCard[]
  onCardClick: (card: BusinessCard) => void
}

export function GridView({ data, onCardClick }: GridViewProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {data.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            className="bg-white shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer hover:bg-gray-50" 
            onClick={() => onCardClick(card)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={card.imageUrl} alt={card.name} />
                  <AvatarFallback>
                    {card.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col">
                    <h3 className="font-medium leading-none">
                      {card.name || card.name_en}
                      {card.name && card.name_en && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({card.name_en})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {card.position || card.position_en}
                      {card.position && card.position_en && (
                        <span className="ml-2">
                          ({card.position_en})
                        </span>
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
                  <div className="flex flex-col space-y-1 text-sm text-gray-500">
                    <span>{card.email}</span>
                    <span>{card.phone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}