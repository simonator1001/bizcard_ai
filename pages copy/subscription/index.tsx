import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const SubscriptionPageComponent = dynamic(
  () => import('@/components/subscription-page').then(mod => mod.SubscriptionPage),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false
  }
)

export default function SubscriptionRoute() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <SubscriptionPageComponent />
      </div>
    </div>
  )
} 