import { db } from "./server/db";
import { unitSessions } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function createWorkingSessions() {
  try {
    console.log("🔧 Creating working sessions for Martin Mwangi's unit...");

    const unitId = 5; // computer programming unit
    
    // Delete any existing broken sessions
    await db.delete(unitSessions).where(eq(unitSessions.unitId, unitId));
    console.log("🗑️ Cleared existing sessions");

    const today = new Date();
    const sessions = [
      {
        unitId: unitId,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        startTime: "09:00",
        endTime: "10:30",
        location: "Computer Lab A",
        dayOfWeek: "Monday",
        isActive: true
      },
      {
        unitId: unitId,
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // yesterday
        startTime: "14:00", 
        endTime: "15:30",
        location: "Computer Lab B",
        dayOfWeek: "Tuesday",
        isActive: true
      },
      {
        unitId: unitId,
        date: today, // today
        startTime: "11:00",
        endTime: "12:30", 
        location: "Lecture Hall 1",
        dayOfWeek: "Wednesday",
        isActive: true
      },
      {
        unitId: unitId,
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        startTime: "10:00",
        endTime: "11:30",
        location: "Computer Lab A", 
        dayOfWeek: "Thursday",
        isActive: true
      },
      {
        unitId: unitId,
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // day after tomorrow
        startTime: "15:00",
        endTime: "16:30",
        location: "Computer Lab C",
        dayOfWeek: "Friday",
        isActive: true
      }
    ];

    // Insert sessions one by one
    for (const sessionData of sessions) {
      try {
        const [newSession] = await db
          .insert(unitSessions)
          .values(sessionData)
          .returning();
        
        console.log(`✅ Created session: ${newSession.date.toDateString()} ${newSession.startTime}-${newSession.endTime} at ${newSession.location}`);
      } catch (error) {
        console.log(`⚠️ Error creating session:`, error);
      }
    }

    console.log("\n🎉 Sessions created successfully!");
    console.log("💡 Martin can now see active sessions with proper dates and manage student attendance!");

  } catch (error) {
    console.error("❌ Error creating sessions:", error);
  }
}

// Run the script
createWorkingSessions();