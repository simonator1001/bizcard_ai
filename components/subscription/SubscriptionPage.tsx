'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PricingCard } from "@/components/ui/pricing-card"

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

export function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false)

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
    <div className="flex flex-col items-center gap-8 py-12 bg-gradient-to-br from-slate-800 to-slate-900 min-h-screen">
      <h2 className="text-4xl font-bold text-white mb-8">Choose Your Plan</h2>
      <div className="flex flex-wrap gap-8 justify-center">
        <PricingCard
          heading="Free"
          description="For individuals getting started"
          price={0}
          buttonText="Get Started"
          list={[
            "Scan up to 5 cards/month",
            "Basic OCR (English only)",
            "Limited news feed",
            "Basic card management",
          ]}
          onButtonClick={() => window.location.href = "/signup"}
        />
        <PricingCard
          heading="Pro"
          description="For professionals and teams"
          price={9.99}
          buttonText="Upgrade to Pro"
          discount={20}
          listHeading="Everything in Free, plus:"
          list={[
            "Unlimited card scans",
            "Advanced OCR (multi-language)",
            "Full news feed access",
            "Organization chart view",
            "Priority support",
          ]}
          onButtonClick={() => window.open('https://buy.stripe.com/test_dR6aHf41X51fbe07su', '_blank')}
        />
        <PricingCard
          heading="Enterprise"
          description="For large organizations"
          price={49.99}
          buttonText="Contact Sales"
          listHeading="Everything in Pro, plus:"
          list={[
            "Custom branding",
            "API access",
            "Advanced analytics",
            "Dedicated support",
            "Team management",
          ]}
          onButtonClick={() => window.location.href = "mailto:support@simon-gpt.com?subject=Enterprise%20Plan%20Inquiry"}
        />
      </div>
    </div>
  )
}

export default SubscriptionPage