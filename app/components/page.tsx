"use client"

import { GradientBorderCardDemo } from "@/components/ui/gradient-border-card"

export default function ComponentsShowcase() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">UI Components Showcase</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Gradient Border Card</h2>
        <GradientBorderCardDemo />
      </section>

      {/* Add more component sections here */}
    </div>
  )
} 