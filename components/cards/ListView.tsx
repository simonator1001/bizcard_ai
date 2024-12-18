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

interface ListViewProps {
  data: BusinessCard[]
  onCardClick: (card: BusinessCard) => void
}

export function ListView({ data, onCardClick }: ListViewProps) {
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {data.map((card) => (
        <motion.div
          key={card.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <Card 
            className="bg-gradient-to-b from-white to-gray-50/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden backdrop-blur-sm border border-gray-100"
            onClick={() => onCardClick(card)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
                  <AvatarImage src={card.imageUrl} alt={card.name} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {card.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 flex justify-between items-center">
                  <div className="flex-1">
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
                      <p className="text-sm text-gray-500">
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
                  </div>
                  <div className="flex flex-col text-right text-sm text-gray-500 ml-4">
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