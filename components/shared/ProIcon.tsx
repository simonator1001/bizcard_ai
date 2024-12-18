'use client'

import { Star } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function ProIcon() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping">
          <Star className="h-24 w-24 text-yellow-400/50" />
        </div>
        <Star className="h-24 w-24 text-yellow-500 relative" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white drop-shadow-lg">PRO</span>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
      <p className="mt-4 text-gray-600 max-w-md">
        Get access to advanced features like AI-powered insights, unlimited card storage, 
        and priority support.
      </p>
      
      <div className="mt-8 space-y-4">
        <ul className="text-left space-y-3">
          <li className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Unlimited business card storage
          </li>
          <li className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Advanced AI insights and analytics
          </li>
          <li className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Priority customer support
          </li>
          <li className="flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Export to multiple formats
          </li>
        </ul>
        
        <Button 
          className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  )
} 