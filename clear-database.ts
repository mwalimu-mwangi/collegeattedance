// Script to clear all data from the database tables
import { db } from './server/db';
import { 
  users, 
  departments,
  sections,
  levels,
  courses,
  units,
  academicTerms,
  unitSchedules,
  unitSessions,
  enrollments,
  attendance,
  recordsOfWork
} from './shared/schema';
import { eq } from 'drizzle-orm';

async function clearDatabase() {
  console.log('Starting database clear operation...');
  
  try {
    // Clear data in reverse order of dependencies to avoid foreign key constraint issues
    console.log('Clearing attendance data...');
    await db.delete(attendance);
    
    console.log('Clearing records of work data...');
    await db.delete(recordsOfWork);
    
    console.log('Clearing enrollments data...');
    await db.delete(enrollments);
    
    console.log('Clearing unit sessions data...');
    await db.delete(unitSessions);
    
    console.log('Clearing unit schedules data...');
    await db.delete(unitSchedules);
    
    console.log('Clearing academic terms data...');
    await db.delete(academicTerms);
    
    console.log('Clearing units data...');
    await db.delete(units);
    
    console.log('Clearing courses data...');
    await db.delete(courses);
    
    console.log('Clearing levels data...');
    await db.delete(levels);
    
    console.log('Clearing sections data...');
    await db.delete(sections);
    
    console.log('Clearing departments data...');
    await db.delete(departments);
    
    // Clear all users
    console.log('Clearing all users data...');
    await db.delete(users);

    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Run the function
clearDatabase();