import { db } from "./server/db";
import { unitClasses } from "./shared/schema";

async function fixStudentSessionConnection() {
  console.log("Connecting unit 5 to classes so students show up in sessions...");
  
  try {
    // Connect unit 5 (Computer Programming) to classes 1 and 7 (where our test students are enrolled)
    await db.insert(unitClasses).values([
      { unitId: 5, classId: 1 }, // ICT Level 6 Morning
      { unitId: 5, classId: 7 }  // ICT Level 6 Afternoon
    ]).onConflictDoNothing();
    
    console.log("Successfully connected Computer Programming unit to student classes!");
    console.log("Students should now appear in your Teacher Attendance module.");
    
  } catch (error) {
    console.error("Error connecting unit to classes:", error);
  }
  
  process.exit(0);
}

fixStudentSessionConnection();