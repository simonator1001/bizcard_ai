import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from 'framer-motion'

interface BusinessCard {
  id: string
  name: string
  name_zh: string
  company: string
  company_zh: string
  title: string
  title_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
  description: string
  imageUrl: string
  created_at: string
  updated_at: string
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
            className="bg-white shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer hover:bg-gray-50 overflow-hidden" 
            onClick={() => onCardClick(card)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={card.imageUrl} alt={card.name} />
                  <AvatarFallback>
                    {card.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col">
                    <h3 className="font-medium leading-none mb-1">
                      <span className="inline-block truncate max-w-[200px]">
                        {card.name_zh || card.name}
                      </span>
                      {card.name_zh && card.name && (
                        <span className="text-sm text-gray-500 ml-1 inline-block truncate max-w-[200px]">
                          ({card.name})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                      <span className="inline-block truncate max-w-[200px]">
                        {card.title_zh || card.title}
                      </span>
                      {card.title_zh && card.title && (
                        <span className="ml-1 inline-block truncate max-w-[200px]">
                          ({card.title})
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      <span className="inline-block truncate max-w-[200px]">
                        {card.company_zh || card.company}
                      </span>
                      {card.company_zh && card.company && (
                        <span className="text-sm text-gray-500 ml-1 inline-block truncate max-w-[200px]">
                          ({card.company})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-0.5 text-sm text-gray-500 mt-1">
                    <span className="truncate max-w-[200px]">{card.email}</span>
                    <span className="truncate max-w-[200px]">{card.phone}</span>
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