import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { pool } from "./server/db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUsers() {
  try {
    console.log("Creating test users...");
    
    const client = await pool.connect();
    
    try {
      // Admin user
      const adminCheck = await client.query("SELECT * FROM users WHERE username = $1", ["admin"]);
      if (adminCheck.rows.length === 0) {
        const adminUser = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["admin", await hashPassword("admin123"), "System Administrator", "admin@example.com", "admin"]
        );
        console.log("Created admin user:", adminUser.rows[0].username);
      } else {
        console.log("Admin user already exists");
      }
      
      // Teacher user
      const teacherCheck = await client.query("SELECT * FROM users WHERE username = $1", ["teacher"]);
      if (teacherCheck.rows.length === 0) {
        const teacherUser = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["teacher", await hashPassword("teacher123"), "John Smith", "teacher@example.com", "teacher"]
        );
        console.log("Created teacher user:", teacherUser.rows[0].username);
      } else {
        console.log("Teacher user already exists");
      }
      
      // Second Teacher user
      const teacher2Check = await client.query("SELECT * FROM users WHERE username = $1", ["teacher2"]);
      if (teacher2Check.rows.length === 0) {
        const teacher2User = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["teacher2", await hashPassword("teacher123"), "Sarah Johnson", "sarah@example.com", "teacher"]
        );
        console.log("Created second teacher user:", teacher2User.rows[0].username);
      } else {
        console.log("Second teacher user already exists");
      }
      
      // Student user
      const studentCheck = await client.query("SELECT * FROM users WHERE username = $1", ["student"]);
      if (studentCheck.rows.length === 0) {
        const studentUser = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["student", await hashPassword("student123"), "Alice Brown", "student@example.com", "student"]
        );
        console.log("Created student user:", studentUser.rows[0].username);
      } else {
        console.log("Student user already exists");
      }
      
      // Second Student user
      const student2Check = await client.query("SELECT * FROM users WHERE username = $1", ["student2"]);
      if (student2Check.rows.length === 0) {
        const student2User = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["student2", await hashPassword("student123"), "Robert Davis", "robert@example.com", "student"]
        );
        console.log("Created second student user:", student2User.rows[0].username);
      } else {
        console.log("Second student user already exists");
      }
      
      // HOD (Head of Department) user
      const hodCheck = await client.query("SELECT * FROM users WHERE username = $1", ["hod"]);
      if (hodCheck.rows.length === 0) {
        const hodUser = await client.query(
          "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          ["hod", await hashPassword("hod123"), "Dr. James Wilson", "hod@example.com", "hod"]
        );
        console.log("Created HOD user:", hodUser.rows[0].username);
      } else {
        console.log("HOD user already exists");
      }
      
      console.log("All test users created successfully!");
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();