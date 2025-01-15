import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { SubscriptionService } from './subscription-service'
import { supabase } from './supabase-client'

interface SubscriptionState {
  canScan: boolean
  canAddCompany: boolean
  canAddCard: boolean
  loading: boolean
  checkAction: (action: 'scan' | 'company' | 'card') => Promise<boolean>
  incrementUsage: (action: 'scan' | 'company' | 'card') => Promise<void>
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
  const [state, setState] = useState<Omit<SubscriptionState, 'checkAction' | 'incrementUsage'>>({
    canScan: false,
    canAddCompany: false,
    canAddCard: false,
    loading: true,
  })
  const { user } = useAuth()

  const checkAllActions = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      const [canScan, canAddCompany, canAddCard] = await Promise.all([
        SubscriptionService.canPerformAction(user.id, 'scan'),
        SubscriptionService.canPerformAction(user.id, 'company'),
        SubscriptionService.canPerformAction(user.id, 'card'),
      ])

      setState({
        canScan,
        canAddCompany,
        canAddCard,
        loading: false,
      })
    } catch (error) {
      console.error('Error checking subscription limits:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user])

  useEffect(() => {
    checkAllActions()
  }, [checkAllActions])

  const checkAction = useCallback(async (action: 'scan' | 'company' | 'card') => {
    if (!user) return false

    try {
      const canPerform = await SubscriptionService.canPerformAction(user.id, action)
      setState(prev => ({
        ...prev,
        [`can${action.charAt(0).toUpperCase() + action.slice(1)}`]: canPerform,
      }))
      return canPerform
    } catch (error) {
      console.error(`Error checking ${action} limit:`, error)
      return false
    }
  }, [user])

  const incrementUsage = useCallback(async (action: 'scan' | 'company' | 'card') => {
    if (!user) return

    try {
      await SubscriptionService.incrementUsage(user.id, action)
      checkAllActions() // Refresh limits after incrementing usage
    } catch (error) {
      console.error(`Error incrementing ${action} usage:`, error)
    }
  }, [user, checkAllActions])

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        checkAction,
        incrementUsage,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}