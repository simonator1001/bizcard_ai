// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Maintenance function loaded')

serve(async (req) => {
  try {
    // Parse the request body
    const { maintenance_key } = await req.json()
    
    if (!maintenance_key) {
      return new Response(JSON.stringify({ error: 'Missing maintenance key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Call the maintenance function
    const { error } = await supabaseClient.rpc('maintenance_endpoint', { maintenance_key })
    
    if (error) throw error
    
    return new Response(JSON.stringify({ message: 'Maintenance completed successfully' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Maintenance error:', error)
    return new Response(JSON.stringify({ 
      error: 'Maintenance failed',
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 