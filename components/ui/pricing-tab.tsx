"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TabProps {
  text: string
  selected: boolean
  setSelected: (text: string) => void
  discount?: boolean
}

export function Tab({
  text,
  selected,
  setSelected,
  discount = false,
}: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative w-fit px-4 py-2 text-sm font-semibold capitalize",
        "text-foreground transition-colors",
        discount && "flex items-center justify-center gap-2.5"
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-background shadow-sm"
        />
      )}
      {discount && (
        <Badge
          variant="secondary"
          className={cn(
            "relative z-10 whitespace-nowrap shadow-none",
            selected && "bg-muted"
          )}
        >
          Save 35%
        </Badge>
      )}
    </button>
  )
}

const FREQUENCIES = ["monthly", "yearly"]

export function TabDemo() {
  const [selected, setSelected] = React.useState(FREQUENCIES[0])

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold">Simple Pricing</h3>
        <p className="text-muted-foreground">
          Choose the best plan for your needs
        </p>
      </div>
      
      <div className="flex w-fit rounded-full bg-muted p-1">
        {FREQUENCIES.map((frequency) => (
          <Tab
            key={frequency}
            text={frequency}
            selected={selected === frequency}
            setSelected={setSelected}
            discount={frequency === "yearly"}
          />
        ))}
      </div>
    </div>
  )
} 