"use client"

import React, { useCallback, useEffect } from "react"
import { motion, useMotionTemplate, useMotionValue, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface GradientBorderCardProps extends HTMLMotionProps<"div"> {
  gradientSize?: number
  gradientOpacity?: number
  borderWidth?: number
  children: React.ReactNode
}

export function GradientBorderCard({
  children,
  className,
  gradientSize = 200,
  gradientOpacity = 0.8,
  borderWidth = 1,
  ...props
}: GradientBorderCardProps) {
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    },
    [mouseX, mouseY],
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  useEffect(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  return (
    <motion.div
      className={cn(
        "relative rounded-xl p-[1px] overflow-hidden transition-all duration-300 group",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, 
            hsl(var(--primary) / 0.8), 
            hsl(var(--secondary) / 0.4), 
            transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      <Card className="relative z-10 h-full w-full bg-background text-foreground border-none rounded-xl overflow-hidden">
        <div className="p-6">{children}</div>
      </Card>
    </motion.div>
  )
}

export function GradientBorderCardDemo() {
  return (
    <div className="w-full max-w-md mx-auto">
      <GradientBorderCard className="cursor-pointer">
        <h3 className="text-lg font-bold mb-2">Modern Card Component</h3>
        <p className="text-sm text-foreground/70">
          This card features a dynamic gradient border that responds to mouse movement.
          Hover over different areas to see the interactive gradient effect in action.
        </p>
      </GradientBorderCard>
    </div>
  )
} 