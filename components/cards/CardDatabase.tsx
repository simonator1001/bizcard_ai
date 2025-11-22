import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BusinessCard {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
}

export function CardDatabase() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [cards, setCards] = React.useState<BusinessCard[]>([])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Manage Business Cards</CardTitle>
        <CardDescription>View and manage your scanned business cards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 text-sm rounded-md w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center w-10 h-10 p-0 justify-center"
                onClick={() => {
                  if (window.confirm('This will remove duplicate entries based on email address. Continue?')) {
                    const uniqueEmails = new Set();
                    const uniqueCards = cards.filter(card => {
                      if (uniqueEmails.has(card.email)) {
                        return false;
                      }
                      uniqueEmails.add(card.email);
                      return true;
                    });
                    setCards(uniqueCards);
                    toast.success(`Removed ${cards.length - uniqueCards.length} duplicate entries`);
                  }
                }}
                title="Remove duplicates"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center w-10 h-10 p-0 justify-center"
                title="Filter cards"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {/* Card list will go here */}
          <div className="text-center text-gray-500">
            No business cards found. Start by scanning some cards!
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 