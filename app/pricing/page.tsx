import { Layout } from '@/components/layout/Layout'
import { PricingPlans } from '@/components/subscription/PricingPlans';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that best fits your needs. All plans include a 7-day free trial.
            </p>
          </div>
          <PricingPlans />
        </div>
      </div>
    </div>
  );
} 