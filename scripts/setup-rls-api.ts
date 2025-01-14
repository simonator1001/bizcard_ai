const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

// Supabase Management API base URL
const managementApiUrl = 'https://api.supabase.com/v1';

async function main() {
  try {
    // Enable RLS
    console.log('Enabling RLS on business_cards table...');
    const enableRlsResponse = await fetch(
      `${managementApiUrl}/projects/${projectRef}/tables/business_cards/rls`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          enabled: true
        })
      }
    );

    if (!enableRlsResponse.ok) {
      const error = await enableRlsResponse.json();
      console.error('Error enabling RLS:', error);
      return;
    }

    console.log('RLS enabled successfully');

    // Create policies
    const policies = [
      {
        name: 'read_own_cards',
        definition: 'auth.uid() = user_id',
        operation: 'SELECT'
      },
      {
        name: 'insert_own_cards',
        definition: 'auth.uid() = user_id',
        operation: 'INSERT'
      },
      {
        name: 'update_own_cards',
        definition: 'auth.uid() = user_id',
        operation: 'UPDATE'
      },
      {
        name: 'delete_own_cards',
        definition: 'auth.uid() = user_id',
        operation: 'DELETE'
      }
    ];

    for (const policy of policies) {
      console.log(`\nCreating policy: ${policy.name}`);
      const createPolicyResponse = await fetch(
        `${managementApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            name: policy.name,
            definition: policy.definition,
            operation: policy.operation
          })
        }
      );

      if (!createPolicyResponse.ok) {
        const error = await createPolicyResponse.json();
        console.error(`Error creating policy ${policy.name}:`, error);
      } else {
        console.log(`Policy ${policy.name} created successfully`);
      }
    }

    // Get current policies
    console.log('\nVerifying policies...');
    const policiesResponse = await fetch(
      `${managementApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    if (!policiesResponse.ok) {
      const error = await policiesResponse.json();
      console.error('Error getting policies:', error);
    } else {
      const policies = await policiesResponse.json();
      console.log('Current policies:', policies);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 