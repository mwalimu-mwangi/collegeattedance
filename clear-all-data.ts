import { db } from './server/db';
import { 
  attendance, 
  unitSessions, 
  enrollments, 
  unitClassAssignments,
  classes, 
  units, 
  courses, 
  levels, 
  sections, 
  departments, 
  academicTerms, 
  users 
} from './shared/schema';

async function clearAllData() {
  console.log('🧹 Clearing all data from the system...');
  
  try {
    // Delete in order of dependencies (child tables first)
    
    console.log('Deleting attendance records...');
    await db.delete(attendance);
    
    console.log('Deleting unit class assignments...');
    await db.delete(unitClassAssignments);
    
    console.log('Deleting unit sessions...');
    await db.delete(unitSessions);
    
    console.log('Deleting enrollments...');
    await db.delete(enrollments);
    
    console.log('Deleting classes...');
    await db.delete(classes);
    
    console.log('Deleting units...');
    await db.delete(units);
    
    console.log('Deleting courses...');
    await db.delete(courses);
    
    console.log('Deleting levels...');
    await db.delete(levels);
    
    console.log('Deleting sections...');
    await db.delete(sections);
    
    console.log('Deleting departments...');
    await db.delete(departments);
    
    console.log('Deleting academic terms...');
    await db.delete(academicTerms);
    
    console.log('Deleting all users...');
    await db.delete(users);
    
    console.log('✅ All data cleared successfully!');
    console.log('🎯 Your system is now ready for fresh real data.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create your departments');
    console.log('2. Add sections and levels');
    console.log('3. Create courses and units');
    console.log('4. Set up academic terms');
    console.log('5. Add real users (admin, teachers, students)');
    console.log('6. Create classes and enroll students');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
  
  process.exit(0);
}

clearAllData();