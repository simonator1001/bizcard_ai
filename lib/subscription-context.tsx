import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { SubscriptionService } from './subscription'
import { supabase } from './supabase-client'

interface SubscriptionState {
  canScan: boolean
  canAddCompany: boolean
  canAddCard: boolean
  loading: boolean
  checkAction: (action: 'scan' | 'track_company') => Promise<boolean>
  incrementUsage: (action: 'scan' | 'track_company') => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionState>({
  canScan: false,
  canAddCompany: false,
  canAddCard: false,
  loading: true,
  checkAction: async () => false,
  incrementUsage: async () => {},
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [canScan, setCanScan] = useState(false)
  const [canAddCompany, setCanAddCompany] = useState(false)
  const [canAddCard, setCanAddCard] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkPermissions = useCallback(async () => {
    if (!user?.id) {
      setCanScan(false)
      setCanAddCompany(false)
      setCanAddCard(false)
      setLoading(false)
      return
    }

    try {
      const [canScanResult, canTrackCompanyResult] = await Promise.all([
        SubscriptionService.canPerformAction(user.id, 'scan'),
        SubscriptionService.canPerformAction(user.id, 'track_company')
      ])

      setCanScan(canScanResult)
      setCanAddCompany(canTrackCompanyResult)
      setCanAddCard(true) // Cards are always allowed
      setLoading(false)
    } catch (error) {
      console.error('Error checking permissions:', error)
      setCanScan(false)
      setCanAddCompany(false)
      setCanAddCard(false)
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  const checkAction = useCallback(async (action: 'scan' | 'track_company') => {
    if (!user?.id) return false
    return SubscriptionService.canPerformAction(user.id, action)
  }, [user?.id])

  const incrementUsage = useCallback(async (action: 'scan' | 'track_company') => {
    if (!user?.id) return
    await SubscriptionService.incrementUsage(user.id, action)
    await checkPermissions()
  }, [user?.id, checkPermissions])

  return (
    <SubscriptionContext.Provider value={{
      canScan,
      canAddCompany,
      canAddCard,
      loading,
      checkAction,
      incrementUsage
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}