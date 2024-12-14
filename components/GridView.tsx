import { Card, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'

interface BusinessCard {
  id: string
  name: string
  company: string
  position: string
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
            <CardContent className="p-6 flex flex-col space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">{card.name}</h2>
              <div className="space-y-1">
                <p className="text-lg text-gray-600">{card.position}</p>
                <p className="text-base text-gray-500">{card.company}</p>
              </div>
              <div className="pt-2 space-y-1">
                <p className="text-sm text-gray-600">{card.email}</p>
                <p className="text-sm text-gray-600">{card.phone}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}