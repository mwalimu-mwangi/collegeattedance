import { storage } from './server/storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTeacher() {
  try {
    // First check if teacher already exists
    const existingTeacher = await storage.getUserByUsername('teacher');
    
    if (existingTeacher) {
      console.log('Teacher user already exists, updating password...');
      // Update the password
      const hashedPassword = await hashPassword('teacher123');
      await storage.updateUser(existingTeacher.id, { password: hashedPassword });
      console.log('Password updated successfully!');
    } else {
      // Create a new teacher user
      const hashedPassword = await hashPassword('teacher123');
      const teacher = await storage.createUser({
        username: 'teacher',
        password: hashedPassword,
        fullName: 'John Smith',
        email: 'john.smith@college.edu',
        role: 'teacher',
        departmentId: null
      });
      console.log('Teacher user created successfully!', teacher);
    }
  } catch (error) {
    console.error('Error creating/updating teacher:', error);
  }
}

createTeacher();