import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'

interface CompanySelectProps {
  companies: string[]
  selectedCompanies: string[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onCompanyToggle: (company: string) => void
  onClose: () => void
}

export function CompanySelect({
  companies,
  selectedCompanies,
  searchTerm,
  onSearchChange,
  onCompanyToggle,
  onClose
}: CompanySelectProps) {
  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute left-4 top-4 w-[400px] bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search companies..."
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Companies List */}
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {filteredCompanies.map((company) => (
              <button
                key={company}
                onClick={() => onCompanyToggle(company)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors
                  ${selectedCompanies.includes(company) ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company)}
                    onChange={() => {}}
                    className="mr-3 h-4 w-4"
                  />
                  <span>{company}</span>
                </div>
              </button>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No companies found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 