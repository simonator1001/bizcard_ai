import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2, LucideIcon } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50/90 backdrop-blur-sm hover:shadow-md active:scale-[0.98] focus:ring-gray-200",
        primary: "bg-primary/90 text-white hover:bg-primary backdrop-blur-sm hover:shadow-md active:scale-[0.98] focus:ring-primary/50",
        outline: "border border-primary/20 text-primary hover:bg-primary/5 hover:shadow-md active:scale-[0.98] focus:ring-primary/30",
        ghost: "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 active:scale-[0.98] focus:ring-gray-200",
        destructive: "border border-red-300 text-red-600 hover:bg-red-50 hover:shadow-md active:scale-[0.98] focus:ring-red-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        icon: "h-9 w-9 p-0"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: LucideIcon
  loading?: boolean
  label?: string
}

const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon: Icon, loading, label, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {label || children}
      </button>
    )
  }
)
PremiumButton.displayName = "PremiumButton"

export { PremiumButton, buttonVariants } 