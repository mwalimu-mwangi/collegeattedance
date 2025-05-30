const { Pool } = require('@neondatabase/serverless');

// Configure the WebSocket for Neon serverless
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateCoursesSchema() {
  try {
    console.log("Starting courses schema update...");
    
    // Add section_id column to courses table if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = 'section_id'
        ) THEN
          ALTER TABLE courses ADD COLUMN section_id INTEGER;
        END IF;
      END $$;
    `);
    
    console.log("Courses schema update completed successfully");
  } catch (error) {
    console.error("Error updating courses schema:", error);
  } finally {
    await pool.end();
  }
}

updateCoursesSchema().catch(console.error);