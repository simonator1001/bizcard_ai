import { updateUserRole } from '../lib/supabase-client';

async function main() {
  const userId = 'e5ef1919-56dc-4038-ad34-faeaadb367c5'; // test_wahaha@gmail.com
  try {
    const result = await updateUserRole(userId, 'authenticated');
    console.log('User role updated:', result);
  } catch (err) {
    console.error('Failed to update user role:', err);
    process.exit(1);
  }
}

main(); 