import { Footerdemo } from "@/components/ui/footer-section";
import { PricingCreative } from "@/components/ui/pricing-creative"
import { Button } from "@/components/ui/button"

function Footer() {
  return (
    <div className="block">
      <Footerdemo />
    </div>
  );
}

function PricingCreativeDemo() {
    return <PricingCreative />
}

export { Footer, PricingCreativeDemo } 