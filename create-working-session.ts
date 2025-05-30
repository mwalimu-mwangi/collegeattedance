import { db } from "./server/db";
import { unitSessions } from "./shared/schema";

async function createWorkingSession() {
  console.log("Creating a working session for Martin Mwangi's Computer Programming unit...");
  
  try {
    // Create a session for today with proper timestamps
    const today = new Date();
    const startTime = new Date();
    startTime.setHours(16, 50, 0, 0); // 4:50 PM today
    
    const endTime = new Date();
    endTime.setHours(17, 50, 0, 0); // 5:50 PM today
    
    const [session] = await db.insert(unitSessions).values({
      unitId: 5, // Computer Programming unit
      date: today,
      startTime: startTime,
      endTime: endTime,
      location: "Room 101",
      weekNumber: 1,
      termId: 1,
      isActive: true,
      isCancelled: false
    }).returning();
    
    console.log("Session created successfully:", session);
    console.log("You can now test the Teacher Attendance module!");
    
  } catch (error) {
    console.error("Error creating session:", error);
  }
  
  process.exit(0);
}

createWorkingSession();