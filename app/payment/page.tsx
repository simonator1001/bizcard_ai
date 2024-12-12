'use client'

import { useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Check, Scan, List, Building2, Crown, Newspaper, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Link from 'next/link'
import Image from 'next/image'

export default function PaymentPage() {
  const [isYearly, setIsYearly] = useState(false)
  const proControls = useAnimation()

  useEffect(() => {
    const sequence = async () => {
      await proControls.start({ scale: 1.05, transition: { duration: 0.3 } })
      await proControls.start({ scale: 1, transition: { duration: 0.3 } })
    }
    sequence()
    const interval = setInterval(sequence, 5000)
    return () => clearInterval(interval)
  }, [proControls])

  const plans = [
    {
      name: 'Basic',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: ['Limited uploads', 'Limited sharing', 'Basic AI']
    },
    {
      name: 'Pro',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: ['Unlimited uploads', 'Unlimited sharing', 'Advanced AI']
    },
    {
      name: 'Enterprise',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      features: ['Unlimited uploads', 'Unlimited sharing', 'Unlimited AI']
    }
  ]

  const navItems = [
    { icon: Scan, label: 'Scan', href: '/scan' },
    { icon: List, label: 'Manage', href: '/manage' },
    { icon: Building2, label: 'Org', href: '/org' },
    { icon: Crown, label: 'Pro', href: '/payment' },
    { icon: Newspaper, label: 'News', href: '/news' },
    { icon: Settings, label: 'Settings', href: '/settings' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-900 flex flex-col items-center justify-between p-4 relative overflow-hidden pb-20">
      <div className="absolute inset-0 z-0">
        <Image
          src="/placeholder.svg?height=1080&width=1920"
          alt="Business professional"
          layout="fill"
          objectFit="cover"
          className="opacity-25 blur-md"
        />
      </div>
      
      <motion.div
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full blur-[100px] opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.8) 100%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        <motion.h1 
          className="text-4xl font-bold mb-8 text-center text-white shadow-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Choose Your Plan
        </motion.h1>
        
        <div className="flex items-center justify-center mb-8 bg-white/70 backdrop-blur-md rounded-full p-1">
          <span className={`mr-3 text-sm ${!isYearly ? 'text-blue-900' : 'text-blue-600'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-blue-500"
          />
          <span className={`ml-3 text-sm ${isYearly ? 'text-blue-900' : 'text-blue-600'}`}>Yearly <span className="text-blue-600 font-bold">(20% off)</span></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`bg-white/90 backdrop-blur-md border-blue-200 overflow-hidden relative group hover:shadow-lg transition-all duration-300 ${index === 1 ? 'border-blue-400' : ''}`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className={`text-2xl ${index === 1 ? 'text-blue-600' : 'text-blue-800'}`}>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold mb-4 ${index === 1 ? 'text-blue-600' : 'text-blue-900'}`}>
                    ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    <span className="text-sm font-normal text-blue-600">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-blue-700">
                        <Check className={`h-4 w-4 mr-2 ${index === 1 ? 'text-blue-500' : 'text-blue-400'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${index === 1 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'} text-white transition-colors duration-300`}>
                    Choose Plan
                  </Button>
                </CardFooter>
                {index === 1 && (
                  <motion.div
                    className="absolute top-0 right-0 bg-blue-500 text-white text-xs py-1 px-3 rounded-bl-lg"
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-blue-200 z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-between items-center py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="flex flex-col items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Icon className="h-6 w-6" />
                  <span className="mt-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}