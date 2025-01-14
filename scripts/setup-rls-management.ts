const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Extract project reference from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/supabase\.(.+)\.com/)?.[1]
if (!projectRef) {
  console.error('Could not extract project reference from Supabase URL')
  process.exit(1)
}

const managementApiUrl = 'https://api.supabase.com/v1'

async function main() {
  try {
    // Enable RLS
    console.log('Enabling RLS...')
    const rlsResponse = await fetch(
      `${managementApiUrl}/projects/${projectRef}/tables/business_cards/rls`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ enabled: true })
      }
    )

    if (!rlsResponse.ok) {
      const error = await rlsResponse.json()
      console.error('Error enabling RLS:', error)
      return
    }

    // Create policies
    const policies = [
      {
        name: 'read_own_cards',
        operation: 'SELECT',
        expression: 'auth.uid() = user_id',
        definition: 'Enable read access for users to their own cards'
      },
      {
        name: 'insert_own_cards',
        operation: 'INSERT',
        expression: 'auth.uid() = user_id',
        definition: 'Enable insert access for users to their own cards'
      },
      {
        name: 'update_own_cards',
        operation: 'UPDATE',
        expression: 'auth.uid() = user_id',
        definition: 'Enable update access for users to their own cards'
      },
      {
        name: 'delete_own_cards',
        operation: 'DELETE',
        expression: 'auth.uid() = user_id',
        definition: 'Enable delete access for users to their own cards'
      }
    ]

    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}`)
      const policyResponse = await fetch(
        `${managementApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            name: policy.name,
            operation: policy.operation,
            expression: policy.expression,
            definition: policy.definition
          })
        }
      )

      if (!policyResponse.ok) {
        const error = await policyResponse.json()
        console.error(`Error creating policy ${policy.name}:`, error)
      }
    }

    // Get current policies
    console.log('Verifying policies...')
    const policiesResponse = await fetch(
      `${managementApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    )

    if (!policiesResponse.ok) {
      const error = await policiesResponse.json()
      console.error('Error getting policies:', error)
    } else {
      const policies = await policiesResponse.json()
      console.log('Current policies:', policies)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

main() 