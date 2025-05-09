"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const pricingCardVariants = cva(
  "relative w-full min-w-56 max-w-[320px] transform overflow-hidden rounded-2xl border shadow-xl transition duration-300 bg-gradient-to-br from-slate-800 to-slate-900 hover:shadow-2xl hover:ring-2 hover:ring-primary/40 hover:scale-[1.03]",
  {
    variants: {
      variant: {
        default: "border-slate-700",
        outline: "border-slate-600",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        default: "p-8 lg:p-10",
        sm: "p-6 lg:p-8",
        lg: "p-10 lg:p-12",
      },
      hover: {
        default: "hover:scale-[1.03] hover:shadow-2xl",
        none: "hover:scale-100",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "default"
    }
  }
)

export interface PricingCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingCardVariants> {
  heading: string
  description: string
  price: number
  buttonText: string
  list: string[]
  discount?: number
  listHeading?: string
  onButtonClick?: () => void
}

const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  ({ 
    className, 
    variant, 
    size,
    hover,
    heading,
    description,
    price,
    discount,
    list,
    listHeading,
    buttonText,
    onButtonClick,
    ...props 
  }, ref) => {
    const withDiscount = React.useMemo(() => {
      return Math.round(price - (price * (discount ?? 100)) / 100)
    }, [price, discount])

    return (
      <div
        ref={ref}
        className={cn(pricingCardVariants({ variant, size, hover, className }))}
        {...props}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="mb-4 lg:mb-6 xl:mb-8">
            <h3 className="mb-2 text-3xl font-extrabold text-white drop-shadow-lg lg:mb-4 lg:text-4xl xl:text-5xl">
              {heading}
            </h3>
            <p className="text-slate-200/90 text-base xl:text-lg font-medium drop-shadow-sm">
              {description}
            </p>
          </div>

          <div>
            <div className="mb-3 flex space-x-2 xl:mb-4 items-end">
              <span className="text-4xl font-extrabold text-white drop-shadow-lg lg:text-5xl xl:text-6xl">
                ${discount ? withDiscount : price}
              </span>
              {discount && (
                <span className="text-slate-400/80 line-through md:text-lg lg:text-xl xl:text-2xl font-semibold">
                  ${price}
                </span>
              )}
            </div>

            {discount && (
              <div className="origin-center-right absolute right-[-50%] top-0 w-full -translate-x-6 translate-y-4 rotate-45 bg-gradient-to-r from-slate-600 to-slate-700 text-center text-white lg:text-lg xl:text-xl font-bold shadow-md">
                {discount}% OFF
              </div>
            )}

            <Button
              onClick={onButtonClick}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-lg font-bold py-3 shadow-lg border-0"
            >
              {buttonText}
            </Button>

            <ul className="mt-6 space-y-2 text-slate-100/95 lg:text-lg xl:text-xl">
              {listHeading && <h5 className="mb-1 text-slate-200 font-semibold text-base xl:text-lg">{listHeading}</h5>}
              {list.map((text, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-emerald-400 drop-shadow" />
                  <span className="text-slate-100/95 font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }
)
PricingCard.displayName = "PricingCard"

export { PricingCard, pricingCardVariants } 