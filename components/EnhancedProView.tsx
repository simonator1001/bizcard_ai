import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export function EnhancedProView() {
  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-16 rounded-lg mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Unlock Pro Features for Maximum Efficiency
        </h1>
        <p className="text-xl mb-8">
          Upgrade to Pro and enjoy unlimited storage, advanced OCR, and exclusive features.
        </p>
        <Button 
          variant="secondary" 
          size="lg"
          className="bg-white text-purple-600 hover:bg-gray-100"
        >
          Get Started with Pro
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid gap-8">
          <div className="grid grid-cols-4 gap-4 items-center">
            <div className="font-semibold">Feature</div>
            <div className="font-semibold">Free Plan</div>
            <div className="font-semibold flex items-center gap-2">
              Pro Plan
              <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                Best Value
              </span>
            </div>
          </div>

          {[
            { name: "Scan Business Cards", free: true, pro: true },
            { name: "Store Cards", free: "Up to 100", pro: "Unlimited" },
            { name: "Basic Search", free: true, pro: true },
            { name: "Advanced OCR", free: false, pro: true },
            { name: "Org Chart Visualization", free: false, pro: true },
            { name: "News Consolidation", free: false, pro: true },
          ].map((feature) => (
            <div key={feature.name} className="grid grid-cols-4 gap-4 items-center py-4 border-t">
              <div>{feature.name}</div>
              <div>
                {typeof feature.free === 'boolean' ? (
                  feature.free ? <Check className="text-green-500" /> : <X className="text-red-500" />
                ) : (
                  feature.free
                )}
              </div>
              <div>
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? <Check className="text-green-500" /> : <X className="text-red-500" />
                ) : (
                  feature.pro
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EnhancedProView