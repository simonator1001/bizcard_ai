'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Check, X, CreditCard, Search, Users, Zap, HelpCircle, ChevronRight } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

const planFeatures = [
  { name: "Scan Business Cards", free: true, pro: true },
  { name: "Store Cards", free: "Up to 100", pro: "Unlimited" },
  { name: "Basic Search", free: true, pro: true },
  { name: "Advanced OCR", free: false, pro: true },
  { name: "Org Chart Visualization", free: false, pro: true },
  { name: "News Consolidation", free: false, pro: true },
  { name: "API Access", free: false, pro: true },
  { name: "Priority Support", free: false, pro: true },
]

const testimonials = [
  {
    name: "John Doe",
    company: "Tech Innovators Inc.",
    photo: "/placeholder.svg?height=100&width=100",
    comment: "The Pro features have revolutionized how we manage our business contacts. The org chart feature is a game-changer!"
  },
  {
    name: "Jane Smith",
    company: "Global Enterprises Ltd.",
    photo: "/placeholder.svg?height=100&width=100",
    comment: "Unlimited card storage and advanced OCR have made our networking efforts so much more efficient. It's worth every penny!"
  },
  {
    name: "Alex Johnson",
    company: "StartUp Solutions",
    photo: "/placeholder.svg?height=100&width=100",
    comment: "The news consolidation feature keeps us informed about our contacts' companies. It's like having a personal business intelligence tool!"
  }
]

const faqs = [
  {
    question: "What happens if I downgrade?",
    answer: "If you downgrade from Pro to Free, you'll retain access to your first 100 stored cards. Additional cards and Pro features will be inaccessible until you upgrade again."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your Pro subscription at any time. Your Pro features will remain active until the end of your current billing cycle."
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "We offer a 14-day free trial of Pro features. You can upgrade to try it out and downgrade before the trial ends if you decide it's not for you."
  }
]

export function EnhancedProView() {
  const [isPro] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async () => {
    try {
      // Add your subscription/payment logic here
      toast({
        title: "Upgrading to Pro...",
        description: "Redirecting to payment page",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate upgrade process. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)] bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="py-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <h1 className="text-4xl font-bold mb-4 animate-fade-in-down">Unlock Pro Features for Maximum Efficiency</h1>
        <p className="text-xl mb-8 animate-fade-in-up">Upgrade to Pro and enjoy unlimited storage, advanced OCR, and exclusive features.</p>
        <Button 
          size="lg" 
          className="bg-white text-purple-600 hover:bg-purple-100 transition-all duration-300 animate-bounce"
          onClick={handleUpgrade}
        >
          Get Started with Pro
        </Button>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Feature</TableHead>
                  <TableHead className="w-1/3">Free Plan</TableHead>
                  <TableHead className="w-1/3 bg-purple-100">
                    Pro Plan
                    <Badge className="ml-2 bg-purple-600">Best Value</Badge>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planFeatures.map((feature, index) => (
                  <TableRow key={index}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell>
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? <Check className="text-green-500" /> : <X className="text-red-500" />
                      ) : (
                        feature.free
                      )}
                    </TableCell>
                    <TableCell className="bg-purple-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? <Check className="text-green-500" /> : <X className="text-red-500" />
                      ) : (
                        feature.pro
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell>$0/month</TableCell>
                  <TableCell className="bg-purple-50">
                    $19.99/month
                    <Button className="ml-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                      Upgrade to Pro
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Highlights</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="unlimited-storage">
              <AccordionTrigger>
                <div className="flex items-center">
                  <CreditCard className="mr-2" />
                  Unlimited Card Storage
                </div>
              </AccordionTrigger>
              <AccordionContent>
                Store as many business cards as you need without worrying about limits. Perfect for networking professionals and growing businesses.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="advanced-ocr">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Search className="mr-2" />
                  Advanced OCR
                </div>
              </AccordionTrigger>
              <AccordionContent>
                Our cutting-edge OCR technology ensures higher accuracy in text recognition, even for complex business card layouts and multiple languages.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="org-chart">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Users className="mr-2" />
                  Org Chart Visualization
                </div>
              </AccordionTrigger>
              <AccordionContent>
                Visualize complex organizational structures with our advanced, interactive org chart feature. Understand company hierarchies at a glance.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="news-consolidation">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Zap className="mr-2" />
                  News Consolidation
                </div>
              </AccordionTrigger>
              <AccordionContent>
                Stay informed about your contacts' companies with our AI-powered news aggregation. Get relevant updates delivered directly to your dashboard.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Testimonials Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Pro Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center">
                    <img src={testimonial.photo} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                    <div>
                      <CardTitle>{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.company}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="italic">&ldquo;{testimonial.comment}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center">
                    <HelpCircle className="mr-2" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-gray-100 py-8 text-center">
        <p className="mb-4">Ready to take your networking to the next level?</p>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
          Upgrade to Pro Now <ChevronRight className="ml-2" />
        </Button>
      </footer>
    </div>
  )
}

export default EnhancedProView