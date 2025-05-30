import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function updateLevelsSchema() {
  try {
    console.log('Starting migration to update levels table schema...');
    
    // Drop the department and section constraints from levels table
    await db.execute(sql`
      ALTER TABLE levels 
      ALTER COLUMN department_id DROP NOT NULL,
      DROP COLUMN IF EXISTS section_id
    `);
    
    console.log('Successfully updated levels table schema!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating levels table schema:', error);
    process.exit(1);
  }
}

updateLevelsSchema();