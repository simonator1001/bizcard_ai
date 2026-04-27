'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Check, X, CreditCard, Search, Users, Zap, HelpCircle, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from 'react-i18next'
import { useUser } from '@/hooks/useUser'
// DISABLED: Supabase removed

const planFeatures = [
  // Card Scanning Features
  { key: "cardScanning" },
  { key: "ocrSupport" },
  { key: "cardManagement" },
  { key: "duplicateRemoval" },
  { key: "export" },
  
  // News Features
  { key: "companyTracking" },
  { key: "newsUpdates" },
  { key: "newsSources" },
  { key: "newsHistory" },
  { key: "emailDigests" },
  
  // Advanced Features
  { key: "aiFeatures" },
  { key: "competitorAnalysis" },
  { key: "marketPredictions" },
  { key: "teamSharing" },
  { key: "customAnnotations" },
]

const featureHighlights = [
  { key: "storage", icon: CreditCard },
  { key: "ocr", icon: Search },
  { key: "orgChart", icon: Users },
  { key: "news", icon: Zap },
]

export function EnhancedProView() {
  const [isPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()
  const { user } = useUser()

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: t('errors.loginRequired'),
        description: t('errors.pleaseSignIn'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // DISABLED: Supabase removed - get session stub
      // Get session for auth token
      const session = { access_token: 'disabled' };
      if (!session) {
        throw new Error("No active session found");
      }

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tier: 'pro',
          frequency: 'yearly' // Default to yearly for best value
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }

      toast({
        title: t('pro.buttons.upgradePro'),
        description: "Redirecting to payment page",
      })
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('errors.somethingWentWrong'),
        description: t('errors.tryAgainLater'),
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)] bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="py-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <h1 className="text-4xl font-bold mb-4 animate-fade-in-down">{t('pro.title')}</h1>
        <p className="text-xl mb-8 animate-fade-in-up">{t('pro.subtitle')}</p>
        <Button 
          size="lg" 
          className="bg-white text-purple-600 hover:bg-purple-100 transition-all duration-300 animate-bounce"
          onClick={handleUpgrade}
        >
          {t('pro.getStarted')}
        </Button>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">{t('pro.choosePlan')}</h2>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">{t('pro.feature')}</TableHead>
                  <TableHead className="w-1/4">{t('pro.freePlan')}</TableHead>
                  <TableHead className="w-1/4">{t('pro.basicPlan')}</TableHead>
                  <TableHead className="w-1/4 bg-purple-100">
                    {t('pro.proPlan')}
                    <Badge className="ml-2 bg-purple-600">{t('pro.bestValue')}</Badge>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planFeatures.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell>{t(`pro.features.${feature.key}.name`)}</TableCell>
                    <TableCell>
                      {t(`pro.features.${feature.key}.free`, { defaultValue: false }) ? (
                        <Check className="text-green-500" />
                      ) : t(`pro.features.${feature.key}.free`) ? (
                        t(`pro.features.${feature.key}.free`)
                      ) : (
                        <X className="text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {t(`pro.features.${feature.key}.basic`, { defaultValue: false }) ? (
                        <Check className="text-green-500" />
                      ) : t(`pro.features.${feature.key}.basic`) ? (
                        t(`pro.features.${feature.key}.basic`)
                      ) : (
                        <X className="text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="bg-purple-50">
                      {t(`pro.features.${feature.key}.pro`, { defaultValue: false }) ? (
                        <Check className="text-green-500" />
                      ) : t(`pro.features.${feature.key}.pro`) ? (
                        t(`pro.features.${feature.key}.pro`)
                      ) : (
                        <X className="text-red-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>{t('pro.feature')}</TableCell>
                  <TableCell>{t('pro.price.free')}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">{t('pro.price.basic.monthly')}</span>
                      <span className="text-sm text-gray-600">{t('pro.price.basic.yearly')}</span>
                      <Button 
                        onClick={() => window.location.href = 'https://buy.stripe.com/test_bIY3eN9mh9hv95SbIJ'}
                        className="mt-2 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                      >
                        {t('pro.buttons.getBasic')}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="bg-purple-50">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">{t('pro.price.pro.monthly')}</span>
                      <span className="text-sm text-gray-600">{t('pro.price.pro.yearly')}</span>
                      <Button 
                        onClick={handleUpgrade}
                        disabled={loading}
                        className={`mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            {t('common.processing')}
                          </>
                        ) : (
                          <>
                            {t('pro.buttons.upgradePro')} <ChevronRight className="ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">{t('pro.sections.featureHighlights.title')}</h2>
          <Accordion type="single" collapsible className="w-full">
            {featureHighlights.map((feature) => (
              <AccordionItem key={feature.key} value={feature.key}>
                <AccordionTrigger>
                  <div className="flex items-center">
                    <feature.icon className="mr-2" />
                    {t(`pro.sections.featureHighlights.${feature.key}.title`)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {t(`pro.sections.featureHighlights.${feature.key}.description`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">{t('pro.sections.faq.title')}</h2>
          <Accordion type="single" collapsible className="w-full">
            {['downgrade', 'cancel', 'trial'].map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>
                  <div className="flex items-center">
                    <HelpCircle className="mr-2" />
                    {t(`pro.sections.faq.questions.${key}.question`)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {t(`pro.sections.faq.questions.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-gray-100 py-8 text-center">
        <p className="mb-4">{t('pro.footer.cta')}</p>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t('common.processing')}
            </>
          ) : (
            <>
          {t('pro.footer.button')} <ChevronRight className="ml-2" />
            </>
          )}
        </Button>
      </footer>
    </div>
  )
}

export default EnhancedProView