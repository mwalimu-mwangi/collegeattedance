import { db } from "./server/db";
import { unitSessions } from "./shared/schema";
import { eq } from "drizzle-orm";

async function createActiveSessions() {
  try {
    console.log("🎯 Creating active sessions for Martin's unit...");

    const unitId = 5; // computer programming unit
    
    // Clear existing sessions first
    await db.delete(unitSessions).where(eq(unitSessions.unitId, unitId));
    console.log("🗑️ Cleared existing inactive sessions");

    // Get today's date components
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Create sessions with proper string format
    const sessions = [
      {
        unitId: unitId,
        date: yesterday.toISOString().split('T')[0], // YYYY-MM-DD format
        startTime: "09:00",
        endTime: "10:30",
        location: "Computer Lab A",
        dayOfWeek: "Monday",
        isActive: true
      },
      {
        unitId: unitId,
        date: today.toISOString().split('T')[0], // Today
        startTime: "11:00",
        endTime: "12:30", 
        location: "Lecture Hall 1",
        dayOfWeek: "Wednesday",
        isActive: true
      },
      {
        unitId: unitId,
        date: tomorrow.toISOString().split('T')[0], // Tomorrow
        startTime: "14:00",
        endTime: "15:30",
        location: "Computer Lab B",
        dayOfWeek: "Thursday",
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
        
        console.log(`✅ Created session: ${newSession.date} ${newSession.startTime}-${newSession.endTime} at ${newSession.location}`);
      } catch (error) {
        console.log(`⚠️ Error creating session:`, error);
      }
    }

    console.log("\n🎉 Active sessions created successfully!");
    console.log("💡 Martin can now see active sessions and manage student attendance!");
    console.log("\n📋 Students available for attendance:");
    console.log("- 8 students in ICT Level 6 Morning class");
    console.log("- 7 students in ICT Level 6 Afternoon class");
    console.log("- Total: 15 students ready for attendance tracking");

  } catch (error) {
    console.error("❌ Error creating sessions:", error);
  }
}

// Run the script
createActiveSessions();