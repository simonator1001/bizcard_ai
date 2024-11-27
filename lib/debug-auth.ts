import { supabase } from './supabase-client'

export const debugAuth = async () => {
  try {
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('=== Session Info ===')
    console.log('Session:', session)
    console.log('Session Error:', sessionError)

    if (session?.access_token) {
      console.log('=== Token Info ===')
      const [header, payload, signature] = session.access_token.split('.')
      const decodedPayload = JSON.parse(atob(payload))
      console.log('JWT Header:', JSON.parse(atob(header)))
      console.log('JWT Payload:', decodedPayload)
      console.log('Role from token:', decodedPayload.role)
      console.log('Claims:', decodedPayload)
    }

    // Test database access
    console.log('=== Database Access Test ===')
    const { data: testData, error: testError } = await supabase
      .from('business_cards')
      .select('id')
      .limit(1)
    console.log('Test Query Result:', testData)
    console.log('Test Query Error:', testError)

  } catch (error) {
    console.error('Debug Error:', error)
  }
} 