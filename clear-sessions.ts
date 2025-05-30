// Script to clear sessions from the database
import { pool } from './server/db';

async function clearSessions() {
  console.log('Clearing session table...');
  
  try {
    // Drop the session table to clear all sessions
    await pool.query('DROP TABLE IF EXISTS session');
    
    console.log('Session table dropped successfully.');
    console.log('Next time the application starts, the session table will be recreated.');
    console.log('You can now log in with the test user accounts.');
    
  } catch (error) {
    console.error('Error clearing sessions:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
clearSessions();