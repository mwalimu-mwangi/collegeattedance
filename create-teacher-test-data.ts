import { db } from "./server/db";
import { users, classes, enrollments, unitSessions, unitClassAssignments, academicTerms } from "./shared/schema";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTeacherTestData() {
  try {
    console.log("🎯 Creating comprehensive test data for Martin Mwangi (Teacher)...");

    // Get Martin's teacher ID
    const [teacher] = await db
      .select()
      .from(users)
      .where(eq(users.username, "mwangi"))
      .limit(1);

    if (!teacher) {
      console.log("❌ Teacher 'mwangi' not found. Creating teacher first...");
      const [newTeacher] = await db
        .insert(users)
        .values({
          username: "mwangi",
          password: await hashPassword("teacher123"),
          fullName: "Martin Mwangi",
          email: "martin.mwangi@college.edu",
          role: "teacher",
          departmentId: 1
        })
        .returning();
      
      teacher.id = newTeacher.id;
      console.log("✅ Created teacher Martin Mwangi");
    }

    console.log(`📚 Teacher ID: ${teacher.id}`);

    // Get the active academic term
    const [activeTerm] = await db
      .select()
      .from(academicTerms)
      .where(eq(academicTerms.isActive, true))
      .limit(1);

    if (!activeTerm) {
      console.log("❌ No active academic term found. Creating one...");
      const [newTerm] = await db
        .insert(academicTerms)
        .values({
          name: "Spring 2024",
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-05-15"),
          weekCount: 16,
          isActive: true
        })
        .returning();
      
      activeTerm.id = newTerm.id;
      console.log("✅ Created active academic term");
    }

    // Create test classes for the teacher's unit
    console.log("🏫 Creating test classes...");
    
    const testClasses = [
      {
        name: "ICT Level 6 - Morning",
        code: "ICT6-AM",
        description: "ICT Technician Level 6 Morning Class",
        courseId: 4, // ICT TECHNICIAN LV6
        termId: activeTerm.id,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-05-15"),
        maxStudents: 25,
        isActive: true
      },
      {
        name: "ICT Level 6 - Afternoon", 
        code: "ICT6-PM",
        description: "ICT Technician Level 6 Afternoon Class",
        courseId: 4, // ICT TECHNICIAN LV6
        termId: activeTerm.id,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-05-15"),
        maxStudents: 25,
        isActive: true
      }
    ];

    const createdClasses = [];
    for (const classData of testClasses) {
      try {
        const [existingClass] = await db
          .select()
          .from(classes)
          .where(eq(classes.code, classData.code))
          .limit(1);

        if (!existingClass) {
          const [newClass] = await db
            .insert(classes)
            .values(classData)
            .returning();
          createdClasses.push(newClass);
          console.log(`✅ Created class: ${newClass.name}`);
        } else {
          createdClasses.push(existingClass);
          console.log(`📋 Class already exists: ${existingClass.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating class ${classData.name}:`, error);
      }
    }

    // Assign unit to classes
    console.log("🔗 Assigning unit to classes...");
    const unitId = 5; // computer programming unit

    for (const classItem of createdClasses) {
      try {
        const [existing] = await db
          .select()
          .from(unitClassAssignments)
          .where(and(
            eq(unitClassAssignments.unitId, unitId),
            eq(unitClassAssignments.classId, classItem.id)
          ))
          .limit(1);

        if (!existing) {
          await db
            .insert(unitClassAssignments)
            .values({
              unitId: unitId,
              classId: classItem.id
            });
          console.log(`✅ Assigned unit to class: ${classItem.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Error assigning unit to class:`, error);
      }
    }

    // Create test students
    console.log("👥 Creating test students...");
    
    const testStudents = [
      { username: "john.doe", fullName: "John Doe", email: "john.doe@student.edu" },
      { username: "jane.smith", fullName: "Jane Smith", email: "jane.smith@student.edu" },
      { username: "mike.johnson", fullName: "Mike Johnson", email: "mike.johnson@student.edu" },
      { username: "sarah.wilson", fullName: "Sarah Wilson", email: "sarah.wilson@student.edu" },
      { username: "david.brown", fullName: "David Brown", email: "david.brown@student.edu" },
      { username: "lisa.davis", fullName: "Lisa Davis", email: "lisa.davis@student.edu" },
      { username: "chris.miller", fullName: "Chris Miller", email: "chris.miller@student.edu" },
      { username: "amanda.garcia", fullName: "Amanda Garcia", email: "amanda.garcia@student.edu" },
      { username: "robert.martinez", fullName: "Robert Martinez", email: "robert.martinez@student.edu" },
      { username: "michelle.anderson", fullName: "Michelle Anderson", email: "michelle.anderson@student.edu" },
      { username: "kevin.taylor", fullName: "Kevin Taylor", email: "kevin.taylor@student.edu" },
      { username: "jessica.thomas", fullName: "Jessica Thomas", email: "jessica.thomas@student.edu" },
      { username: "brian.white", fullName: "Brian White", email: "brian.white@student.edu" },
      { username: "nicole.harris", fullName: "Nicole Harris", email: "nicole.harris@student.edu" },
      { username: "daniel.clark", fullName: "Daniel Clark", email: "daniel.clark@student.edu" }
    ];

    const createdStudents = [];
    for (const studentData of testStudents) {
      try {
        const [existingStudent] = await db
          .select()
          .from(users)
          .where(eq(users.username, studentData.username))
          .limit(1);

        if (!existingStudent) {
          const [newStudent] = await db
            .insert(users)
            .values({
              ...studentData,
              password: await hashPassword("student123"),
              role: "student",
              departmentId: 1
            })
            .returning();
          createdStudents.push(newStudent);
          console.log(`✅ Created student: ${newStudent.fullName}`);
        } else {
          createdStudents.push(existingStudent);
          console.log(`📋 Student already exists: ${existingStudent.fullName}`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating student ${studentData.fullName}:`, error);
      }
    }

    // Enroll students in classes
    console.log("📝 Enrolling students in classes...");
    
    // Split students between the two classes
    const studentsPerClass = Math.ceil(createdStudents.length / createdClasses.length);
    
    for (let i = 0; i < createdClasses.length; i++) {
      const classItem = createdClasses[i];
      const startIndex = i * studentsPerClass;
      const endIndex = Math.min(startIndex + studentsPerClass, createdStudents.length);
      const classStudents = createdStudents.slice(startIndex, endIndex);

      for (const student of classStudents) {
        try {
          const [existingEnrollment] = await db
            .select()
            .from(enrollments)
            .where(and(
              eq(enrollments.studentId, student.id),
              eq(enrollments.classId, classItem.id)
            ))
            .limit(1);

          if (!existingEnrollment) {
            await db
              .insert(enrollments)
              .values({
                studentId: student.id,
                classId: classItem.id,
                courseId: classItem.courseId,
                termId: activeTerm.id,
                status: "active"
              });
            console.log(`✅ Enrolled ${student.fullName} in ${classItem.name}`);
          }
        } catch (error) {
          console.log(`⚠️ Error enrolling student:`, error);
        }
      }
    }

    // Create test sessions for the unit
    console.log("📅 Creating test unit sessions...");
    
    const today = new Date();
    const sessions = [
      {
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        startTime: "09:00",
        endTime: "10:30",
        location: "Computer Lab A",
        dayOfWeek: "Monday"
      },
      {
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
        startTime: "14:00", 
        endTime: "15:30",
        location: "Computer Lab B",
        dayOfWeek: "Tuesday"
      },
      {
        date: today.toISOString().split('T')[0], // today
        startTime: "11:00",
        endTime: "12:30", 
        location: "Lecture Hall 1",
        dayOfWeek: "Wednesday"
      },
      {
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
        startTime: "10:00",
        endTime: "11:30",
        location: "Computer Lab A", 
        dayOfWeek: "Thursday"
      },
      {
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // day after tomorrow
        startTime: "15:00",
        endTime: "16:30",
        location: "Computer Lab C",
        dayOfWeek: "Friday"
      }
    ];

    for (const sessionData of sessions) {
      try {
        const [existingSession] = await db
          .select()
          .from(unitSessions)
          .where(and(
            eq(unitSessions.unitId, unitId),
            eq(unitSessions.date, sessionData.date),
            eq(unitSessions.startTime, sessionData.startTime)
          ))
          .limit(1);

        if (!existingSession) {
          await db
            .insert(unitSessions)
            .values({
              unitId: unitId,
              date: sessionData.date,
              startTime: sessionData.startTime,
              endTime: sessionData.endTime,
              location: sessionData.location,
              dayOfWeek: sessionData.dayOfWeek,
              isActive: true
            });
          console.log(`✅ Created session: ${sessionData.date} ${sessionData.startTime}-${sessionData.endTime}`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating session:`, error);
      }
    }

    console.log("\n🎉 Test data creation completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`👨‍🏫 Teacher: Martin Mwangi (ID: ${teacher.id})`);
    console.log(`🏫 Classes: ${createdClasses.length} classes created`);
    console.log(`👥 Students: ${createdStudents.length} students created`);
    console.log(`📅 Sessions: ${sessions.length} unit sessions created`);
    console.log(`📚 Unit: computer programming (ID: ${unitId})`);
    
    console.log("\n🔐 Login credentials:");
    console.log("Teacher: username=mwangi, password=teacher123");
    console.log("Students: username=[student.username], password=student123");
    
    console.log("\n✨ Martin can now test the teacher attendance module with real students and sessions!");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  }
}

// Run the script
createTeacherTestData();