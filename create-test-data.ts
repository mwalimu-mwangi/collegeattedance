// Script to create fresh test data for the database
import { db } from './server/db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';
import { 
  users,
  departments, 
  sections,
  levels,
  courses,
  units,
  academicTerms
} from './shared/schema';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createTestData() {
  console.log('Creating test data for the College Attendance System...');
  
  try {
    // Create test users
    console.log('Creating test users...');
    
    // Super Admin
    const adminUser = await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      fullName: 'System Administrator',
      email: 'admin@example.com',
      role: 'super_admin',
      departmentId: null
    }).returning();
    console.log('Created admin user:', adminUser[0].username);
    
    // Create departments
    console.log('Creating departments...');
    const computerScience = await db.insert(departments).values({
      name: 'Computer Science',
      code: 'CS',
      headId: null
    }).returning();
    
    const business = await db.insert(departments).values({
      name: 'Business Administration',
      code: 'BA',
      headId: null
    }).returning();
    
    // Create HODs for each department
    const csHod = await db.insert(users).values({
      username: 'hod',
      password: await hashPassword('hod123'),
      fullName: 'Dr. James Wilson',
      email: 'hod@example.com',
      role: 'hod',
      departmentId: computerScience[0].id
    }).returning();
    
    const baHod = await db.insert(users).values({
      username: 'bahod',
      password: await hashPassword('hod123'),
      fullName: 'Dr. Emily Roberts',
      email: 'bahod@example.com',
      role: 'hod',
      departmentId: business[0].id
    }).returning();
    
    // Update departments with HOD IDs
    await db.update(departments)
      .set({ headId: csHod[0].id })
      .where(eq => eq(departments.id, computerScience[0].id));
    
    await db.update(departments)
      .set({ headId: baHod[0].id })
      .where(eq => eq(departments.id, business[0].id));
    
    // Create teachers
    const teacher1 = await db.insert(users).values({
      username: 'teacher',
      password: await hashPassword('teacher123'),
      fullName: 'John Smith',
      email: 'john.smith@example.com',
      role: 'teacher',
      departmentId: computerScience[0].id
    }).returning();
    
    const teacher2 = await db.insert(users).values({
      username: 'teacher2',
      password: await hashPassword('teacher123'),
      fullName: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'teacher',
      departmentId: computerScience[0].id
    }).returning();
    
    // Create students
    const student1 = await db.insert(users).values({
      username: 'student',
      password: await hashPassword('student123'),
      fullName: 'Alice Brown',
      email: 'student@example.com',
      role: 'student',
      departmentId: computerScience[0].id
    }).returning();
    
    const student2 = await db.insert(users).values({
      username: 'student2',
      password: await hashPassword('student123'),
      fullName: 'Robert Davis',
      email: 'robert@example.com',
      role: 'student',
      departmentId: business[0].id
    }).returning();
    
    // Create sections
    console.log('Creating sections...');
    const dayCsSection = await db.insert(sections).values({
      name: 'Day',
      departmentId: computerScience[0].id
    }).returning();
    
    const eveningCsSection = await db.insert(sections).values({
      name: 'Evening',
      departmentId: computerScience[0].id
    }).returning();
    
    const dayBaSection = await db.insert(sections).values({
      name: 'Day',
      departmentId: business[0].id
    }).returning();
    
    // Create levels - now levels are general across all departments
    console.log('Creating levels...');
    const level1 = await db.insert(levels).values({
      name: 'Year 1'
    }).returning();
    
    const level2 = await db.insert(levels).values({
      name: 'Year 2'
    }).returning();
    
    const level3 = await db.insert(levels).values({
      name: 'Year 3'
    }).returning();
    
    const level4 = await db.insert(levels).values({
      name: 'Year 4'
    }).returning();
    
    // Create courses
    console.log('Creating courses...');
    const csCourse = await db.insert(courses).values({
      name: 'Bachelor of Computer Science',
      code: 'BCS',
      levelId: level1[0].id
    }).returning();
    
    const seCourse = await db.insert(courses).values({
      name: 'Bachelor of Software Engineering',
      code: 'BSE',
      levelId: level2[0].id
    }).returning();
    
    const baCourse = await db.insert(courses).values({
      name: 'Bachelor of Business Administration',
      code: 'BBA',
      levelId: level3[0].id
    }).returning();
    
    // Create units
    console.log('Creating units...');
    const unit1 = await db.insert(units).values({
      name: 'Introduction to Programming',
      code: 'CS101',
      courseId: csCourse[0].id,
      teacherId: teacher1[0].id
    }).returning();
    
    const unit2 = await db.insert(units).values({
      name: 'Data Structures',
      code: 'CS201',
      courseId: csCourse[0].id,
      teacherId: teacher2[0].id
    }).returning();
    
    const unit3 = await db.insert(units).values({
      name: 'Web Development',
      code: 'CS204',
      courseId: seCourse[0].id,
      teacherId: teacher1[0].id
    }).returning();
    
    const unit4 = await db.insert(units).values({
      name: 'Introduction to Business',
      code: 'BA101',
      courseId: baCourse[0].id,
      teacherId: teacher2[0].id
    }).returning();
    
    // Create academic terms
    console.log('Creating academic terms...');
    const currentTerm = await db.insert(academicTerms).values({
      name: 'Spring 2023',
      startDate: new Date('2023-01-15').toISOString(),
      endDate: new Date('2023-04-30').toISOString(),
      weekCount: 15,
      isActive: true,
      createdAt: new Date().toISOString()
    }).returning();
    
    console.log('Test data created successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function
createTestData();