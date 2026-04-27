import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { SubscriptionService } from './subscription'
// DISABLED: Supabase removed
import { SUBSCRIPTION_PLANS } from '@/lib/plans'

interface SubscriptionState {
  canScan: boolean
  canAddCompany: boolean
  canAddCard: boolean
  loading: boolean
  error: Error | null
  subscription: any
  usage: any
  checkAction: (action: 'scan' | 'track_company') => Promise<boolean>
  incrementUsage: (action: 'scan' | 'track_company') => Promise<void>
  refreshSubscription: () => Promise<void>
  initialized: boolean
}

const SubscriptionContext = createContext<SubscriptionState>({
  canScan: false,
  canAddCompany: false,
  canAddCard: false,
  loading: true,
  error: null,
  subscription: null,
  usage: null,
  checkAction: async () => false,
  incrementUsage: async () => {},
  refreshSubscription: async () => {},
  initialized: false
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [initialized, setInitialized] = useState(false)

  const fetchSubscriptionData = useCallback(async () => {
    if (!user?.$id) {
      const defaultSubscription = SubscriptionService.getDefaultSubscription('anonymous')
      const defaultUsage = SubscriptionService.getDefaultUsage(SUBSCRIPTION_PLANS.free)
      setSubscription(defaultSubscription)
      setUsage(defaultUsage)
      setLoading(false)
      setInitialized(true)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [newSubscription, newUsage] = await Promise.all([
        SubscriptionService.getCurrentSubscription(user.$id),
        SubscriptionService.getCurrentUsage(user.$id)
      ])
      setSubscription(newSubscription)
      setUsage(newUsage)
      setInitialized(true)
    } catch (err) {
      console.error('[SubscriptionContext] Error fetching subscription data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription data'))
      // Set default values on error
      const defaultSubscription = SubscriptionService.getDefaultSubscription(user.$id)
      const defaultUsage = SubscriptionService.getDefaultUsage(SUBSCRIPTION_PLANS.free)
      setSubscription(defaultSubscription)
      setUsage(defaultUsage)
    } finally {
      setLoading(false)
    }
  }, [user?.$id])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  const checkAction = useCallback(async (action: 'scan' | 'track_company') => {
    if (!user?.$id) return false
    try {
      return await SubscriptionService.canPerformAction(user.$id, action)
    } catch (err) {
      console.error('[SubscriptionContext] Error checking action:', err)
      return false
    }
  }, [user?.$id])

  const incrementUsage = useCallback(async (action: 'scan' | 'track_company') => {
    if (!user?.$id) return
    try {
      await SubscriptionService.incrementUsage(user.$id, action)
      // Refresh subscription data after incrementing usage
      await fetchSubscriptionData()
    } catch (err) {
      console.error('[SubscriptionContext] Error incrementing usage:', err)
      throw err
    }
  }, [user?.$id, fetchSubscriptionData])

  const plan = subscription?.tier ? SUBSCRIPTION_PLANS[subscription.tier.toLowerCase()] || SUBSCRIPTION_PLANS.free : SUBSCRIPTION_PLANS.free
  const canScan = !loading && usage?.remainingScans > 0
  const canAddCompany = !loading && usage?.companiesTracked < plan.limits.companiesTracked
  const canAddCard = !loading && subscription?.status === 'active'

  return (
    <SubscriptionContext.Provider
      value={{
        canScan,
        canAddCompany,
        canAddCard,
        loading,
        error,
        subscription,
        usage,
        checkAction,
        incrementUsage,
        refreshSubscription: fetchSubscriptionData,
        initialized
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}