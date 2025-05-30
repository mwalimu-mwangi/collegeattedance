import { db } from './server/db';
import { users } from './shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    const hashedPassword = await hashPassword('admin123');
    
    const [admin] = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      email: 'admin@college.edu',
      role: 'super_admin',
      departmentId: null
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: Super Admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
  
  process.exit(0);
}

createAdminUser();