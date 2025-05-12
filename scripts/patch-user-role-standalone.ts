import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function patchUserRole(userId: string, role: string = 'authenticated') {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role }
  });
  if (error) {
    console.error('Failed to update user role:', error);
    process.exit(1);
  }
  console.log('User role updated:', data);
}

const userId = 'e5ef1919-56dc-4038-ad34-faeaadb367c5'; // test_wahaha@gmail.com
patchUserRole(userId); 