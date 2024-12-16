'use client'

import { useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: {
    businessCards: string;
    ocrFields: string;
    aiCategorization: string;
    taggingFiltering: string;
    storageSync: string;
    orgChart: string;
    search: string;
    exportOptions: string;
    batchScanning: string;
    teamCollaboration: string;
    remindersAlerts: string;
    cardUpdates: string;
    support: string;
  };
  popular?: boolean;
}

const ShareBusinessCard = ({ url, onClose }: { url: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content container */}
        <div className="p-6">
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Share Business Card
          </h2>

          {/* Link container */}
          <div className="relative mb-6">
            <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
              {/* URL display */}
              <div className="flex-1 min-w-0 px-3 py-2">
                <p className="text-sm text-gray-600 truncate">
                  {url}
                </p>
              </div>
              {/* Copy button */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-l hover:bg-gray-50 transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
              Email
            </button>
            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-[#25D366] rounded-lg hover:bg-[#22BC5C] transition-colors">
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false)
  const proControls = useAnimation()

  const plans: Plan[] = [
    {
      name: 'Free Tier',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: {
        businessCards: '5/month',
        ocrFields: 'Basic fields (name, company)',
        aiCategorization: 'Basic categories',
        taggingFiltering: 'Basic, 2 filters max',
        storageSync: '1 device',
        orgChart: 'Not included',
        search: 'Name and company only',
        exportOptions: 'CSV (10 contacts/export)',
        batchScanning: 'Not available',
        teamCollaboration: 'Not included',
        remindersAlerts: 'Not included',
        cardUpdates: 'Not included',
        support: 'Email (48-hour response)'
      }
    },
    {
      name: 'Pro',
      monthlyPrice: 9.99,
      yearlyPrice: 99,
      features: {
        businessCards: 'Unlimited',
        ocrFields: 'Full extraction (address, title, notes)',
        aiCategorization: 'Sub-industries, custom categories',
        taggingFiltering: 'Unlimited, advanced filtering',
        storageSync: 'Multiple devices, unlimited storage',
        orgChart: 'Auto-generated charts',
        search: 'Full-text search',
        exportOptions: 'CSV, Excel, PDF, CRM integration',
        batchScanning: 'Up to 10 cards at once',
        teamCollaboration: 'Included',
        remindersAlerts: 'Included',
        cardUpdates: 'AI-driven updates',
        support: 'Priority, live chat (12-hour response)'
      },
      popular: true
    }
  ]

  return (
    <div className="w-full flex flex-col items-center p-4">
      <motion.div
        className="fixed inset-0 w-full h-full blur-[120px] opacity-30 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.15) 100%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-center bg-white/50 backdrop-blur-md rounded-full p-1 w-fit mx-auto">
          <span className={`mr-3 text-sm ${!isYearly ? 'text-purple-900' : 'text-purple-600'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-purple-500"
          />
          <span className={`ml-3 text-sm ${isYearly ? 'text-purple-900' : 'text-purple-600'}`}>
            Yearly <span className="text-purple-600 font-bold">(20% off)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`bg-white/70 backdrop-blur-md border-purple-100 overflow-hidden relative group hover:shadow-lg transition-all duration-300 ${
                index === 1 ? 'border-purple-300 shadow-md' : ''
              }`}>
                <CardHeader className="pb-4">
                  <CardTitle className={`text-2xl ${index === 1 ? 'text-purple-600' : 'text-purple-800'}`}>
                    {plan.name}
                  </CardTitle>
                  <div className={`text-4xl font-bold mb-4 ${index === 1 ? 'text-purple-600' : 'text-purple-900'}`}>
                    ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    <span className="text-sm font-normal text-purple-600">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {Object.entries(plan.features).map(([key, value], featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-purple-700">
                        <Check className={`h-4 w-4 mr-2 ${index === 1 ? 'text-purple-500' : 'text-purple-400'}`} />
                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="ml-2">{value}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${
                      index === 1 
                        ? 'bg-purple-500 hover:bg-purple-600' 
                        : 'bg-purple-400 hover:bg-purple-500'
                    } text-white transition-colors duration-300`}
                  >
                    {index === 0 ? 'Current Plan' : 'Upgrade Now'}
                  </Button>
                </CardFooter>
                {plan.popular && (
                  <motion.div
                    className="absolute top-0 right-0 bg-purple-500 text-white text-xs py-1 px-3 rounded-bl-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Popular
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage