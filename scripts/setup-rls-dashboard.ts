const dotenv = require('dotenv');
const path = require('path');
import fetch from 'node-fetch';

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

// Supabase Dashboard API base URL
const dashboardApiUrl = 'https://api.supabase.com/v1';

async function main() {
  try {
    // Get project details
    const projectResponse = await fetch(
      `${dashboardApiUrl}/projects/${projectRef}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!projectResponse.ok) {
      const error = await projectResponse.json();
      console.error('Error getting project details:', error);
      return;
    }

    const project = await projectResponse.json();
    console.log('Project details:', project);

    // Enable RLS
    const enableRlsResponse = await fetch(
      `${dashboardApiUrl}/projects/${projectRef}/tables/business_cards/rls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true
        })
      }
    );

    if (!enableRlsResponse.ok) {
      const error = await enableRlsResponse.json();
      console.error('Error enabling RLS:', error);
    } else {
      console.log('RLS enabled successfully');
    }

    // Create policies
    const policies = [
      {
        name: 'read_own_cards',
        operation: 'SELECT',
        expression: 'auth.uid() = user_id'
      },
      {
        name: 'insert_own_cards',
        operation: 'INSERT',
        expression: 'auth.uid() = user_id'
      },
      {
        name: 'update_own_cards',
        operation: 'UPDATE',
        expression: 'auth.uid() = user_id'
      },
      {
        name: 'delete_own_cards',
        operation: 'DELETE',
        expression: 'auth.uid() = user_id'
      }
    ];

    for (const policy of policies) {
      console.log(`\nCreating policy: ${policy.name}`);
      const createPolicyResponse = await fetch(
        `${dashboardApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: policy.name,
            operation: policy.operation,
            expression: policy.expression
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
    const policiesResponse = await fetch(
      `${dashboardApiUrl}/projects/${projectRef}/tables/business_cards/policies`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!policiesResponse.ok) {
      const error = await policiesResponse.json();
      console.error('Error getting policies:', error);
    } else {
      const policies = await policiesResponse.json();
      console.log('\nCurrent policies:', policies);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 