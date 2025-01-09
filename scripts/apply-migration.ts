const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.simon-gpt.com';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTczMjYwMDg2MCwiZXhwIjo0ODg4Mjc0NDYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.WQXqcz3zsp7ee_M-BkEnPkdRliKB9WeNYjWz7Mp5_6g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Add lastModified column
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE business_cards
        ADD COLUMN IF NOT EXISTS "lastModified" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `
    });

    if (columnError) {
      console.error('Error adding column:', columnError);
      return;
    }

    // Update existing rows
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE business_cards
        SET "lastModified" = updated_at
        WHERE "lastModified" IS NULL;
      `
    });

    if (updateError) {
      console.error('Error updating rows:', updateError);
      return;
    }

    // Create trigger function
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_last_modified()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."lastModified" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.error('Error creating function:', functionError);
      return;
    }

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_business_cards_last_modified ON business_cards;
        CREATE TRIGGER update_business_cards_last_modified
        BEFORE UPDATE ON business_cards
        FOR EACH ROW
        EXECUTE FUNCTION update_last_modified();
      `
    });

    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return;
    }

    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration(); 