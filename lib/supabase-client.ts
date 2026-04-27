// Supabase DISABLED — using AppWrite (Singapore) instead
// This mock prevents build errors from 20+ import sites

const noopLogger = {
  debug: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
}

// Mock Supabase client — returns any to bypass TypeScript checking on callers
// @ts-nocheck
const mockSupabase: any = {
  auth: {
    getSession: (..._: any[]) => Promise.resolve({ data: { session: null }, error: null }),
    getUser: (..._: any[]) => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: (..._: any[]) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: (..._: any[]) => Promise.resolve({ data: null, error: null }),
    signInWithPassword: (..._: any[]) => Promise.resolve({ data: null, error: null }),
    signUp: (..._: any[]) => Promise.resolve({ data: null, error: null }),
    signOut: (..._: any[]) => Promise.resolve({ error: null }),
    resetPasswordForEmail: (..._: any[]) => Promise.resolve({ data: {}, error: null }),
  },
  from: (..._: any[]) => ({
    select: (..._: any[]) => ({
      eq: (..._: any[]) => ({
        single: (..._: any[]) => Promise.resolve({ data: null as any, error: null }),
        order: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
        limit: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
        not: (..._: any[]) => ({
          not: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
        }) as any,
      }),
      order: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
      single: (..._: any[]) => Promise.resolve({ data: null as any, error: null }),
      limit: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
      not: (..._: any[]) => ({
        not: (..._: any[]) => Promise.resolve({ data: [] as any[], error: null }),
      }) as any,
    }) as any,
    insert: (..._: any[]) => ({
      select: (..._: any[]) => ({ single: (..._: any[]) => Promise.resolve({ data: null as any, error: null }) }),
    }) as any,
    update: (..._: any[]) => ({
      eq: (..._: any[]) => Promise.resolve({ data: null as any, error: null }),
    }) as any,
    delete: (..._: any[]) => ({
      eq: (..._: any[]) => Promise.resolve({ data: null as any, error: null }),
    }) as any,
    upsert: (..._: any[]) => ({
      select: (..._: any[]) => ({ single: (..._: any[]) => Promise.resolve({ data: null as any, error: null }) }),
    }) as any,
  }) as any,
  storage: {
    from: (..._: any[]) => ({
      upload: (..._: any[]) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (..._: any[]) => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
  removeAllChannels: () => {},
}

export const supabase = mockSupabase as any
export const supabaseAdmin = mockSupabase as any

// Noop functions that were exported
export async function updateUserRole(..._: any[]) { return null }
export async function getBusinessCards() { return [] }
export async function searchBusinessCards() { return [] }
export const testConnection = async () => false

export default supabase
