'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PricingCard } from "@/components/ui/pricing-card"
import { Pricing } from "@/components/ui/pricing-cards"

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

  return <Pricing />;
}

export default SubscriptionPage