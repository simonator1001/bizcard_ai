import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigrations() {
  try {
    // Read migration files
    const migrationsDir = path.resolve(__dirname, '../migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      console.log(`Applying migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      // Execute migration
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error)
        process.exit(1)
      }
      
      console.log(`Successfully applied migration: ${file}`)
    }

    console.log('All migrations applied successfully')
  } catch (error) {
    console.error('Error applying migrations:', error)
    process.exit(1)
  }
}

applyMigrations() 