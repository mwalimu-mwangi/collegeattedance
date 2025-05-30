import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole, hashPassword } from "./auth";
import { z } from "zod";
import { insertAttendanceSchema, insertRecordOfWorkSchema, insertUnitScheduleSchema, insertUnitSessionSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Test route to verify API routing works
  app.get("/api/test", (req, res) => {
    console.log("Test route hit successfully");
    res.json({ message: "API routing works" });
  });

  // API routes with authentication and role-based access
  
  // User management routes
  app.get("/api/users", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Make sure users is an array
      if (!Array.isArray(users)) {
        return res.status(500).json({ message: "Invalid server response" });
      }
      
      // Remove passwords from response
      const safeUsers = users.map(user => {
        if (user && typeof user === 'object' && 'password' in user) {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        return user;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create user without auto-login (admin only)
  app.post("/api/users", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for unique admission number (students only)
      if (userData.admissionNumber) {
        const existingByAdmission = await storage.getUserByAdmissionNumber(userData.admissionNumber);
        if (existingByAdmission) {
          return res.status(400).json({ message: "Admission number already exists" });
        }
      }

      // Check for unique staff ID (teachers/HODs only)
      if (userData.staffId) {
        const existingByStaffId = await storage.getUserByStaffId(userData.staffId);
        if (existingByStaffId) {
          return res.status(400).json({ message: "Staff ID already exists" });
        }
      }

      // Hash password using the same method as auth.ts
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user without logging them in
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });
  
  app.patch("/api/users/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if username is being changed and if it already exists
      if (updates.username) {
        const existingUser = await storage.getUserByUsername(updates.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Department routes
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });
  
  app.post("/api/departments", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const departmentData = req.body;
      const newDepartment = await storage.createDepartment(departmentData);
      res.status(201).json(newDepartment);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });
  
  app.put("/api/departments/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const departmentData = req.body;
      
      // Get the existing department
      const existingDept = await storage.getDepartment(departmentId);
      if (!existingDept) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Update the department with new data
      const updatedDept = await storage.updateDepartment(departmentId, departmentData);
      res.json(updatedDept);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });
  
  app.delete("/api/departments/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      console.log(`Attempting to delete department with ID: ${departmentId}`);
      
      // First check if department exists
      const department = await storage.getDepartment(departmentId);
      if (!department) {
        console.log(`Department with ID ${departmentId} not found for deletion`);
        return res.status(404).json({ message: "Department not found" });
      }
      
      console.log(`Deleting department: ${JSON.stringify(department)}`);
      await storage.deleteDepartment(departmentId);
      console.log(`Department with ID ${departmentId} successfully deleted`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });
  
  // Section routes
  app.get("/api/departments/:departmentId/sections", isAuthenticated, async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const sections = await storage.getSectionsByDepartment(departmentId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });
  
  app.get("/api/sections", isAuthenticated, async (req, res) => {
    try {
      // Get all sections or filter by department if provided
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : null;
      
      let sections;
      if (departmentId) {
        sections = await storage.getSectionsByDepartment(departmentId);
      } else {
        // Get all sections from all departments
        // This will need to be added to the storage interface
        const departments = await storage.getAllDepartments();
        sections = [];
        
        for (const dept of departments) {
          const deptSections = await storage.getSectionsByDepartment(dept.id);
          sections.push(...deptSections);
        }
      }
      
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });
  
  app.post("/api/sections", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const sectionData = req.body;
      const newSection = await storage.createSection(sectionData);
      res.status(201).json(newSection);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  });
  
  app.get("/api/sections/:id", isAuthenticated, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const section = await storage.getSection(sectionId);
      
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      res.json(section);
    } catch (error) {
      console.error("Error fetching section:", error);
      res.status(500).json({ message: "Failed to fetch section" });
    }
  });
  
  app.put("/api/sections/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const sectionData = req.body;
      
      // Check if section exists
      const existingSection = await storage.getSection(sectionId);
      if (!existingSection) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      // Update section
      const updatedSection = await storage.updateSection(sectionId, sectionData);
      res.json(updatedSection);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });
  
  app.delete("/api/sections/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      console.log(`Attempting to delete section with ID: ${sectionId}`);
      
      // Check if section exists
      const section = await storage.getSection(sectionId);
      if (!section) {
        console.log(`Section with ID ${sectionId} not found for deletion`);
        return res.status(404).json({ message: "Section not found" });
      }
      
      console.log(`Deleting section: ${JSON.stringify(section)}`);
      await storage.deleteSection(sectionId);
      console.log(`Section with ID ${sectionId} successfully deleted`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });
  
  // Get courses by department
  app.get("/api/departments/:departmentId/courses", isAuthenticated, async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      
      // Use direct storage method for department courses
      const departmentCourses = await storage.getCoursesByDepartment(departmentId);
      
      res.json(departmentCourses);
    } catch (error) {
      console.error("Error fetching department courses:", error);
      res.status(500).json({ message: "Failed to fetch department courses" });
    }
  });

  // Level routes
  app.get("/api/departments/:departmentId/levels", isAuthenticated, async (req, res) => {
    try {
      // Now all levels are available to all departments since they're general
      const levels = await storage.getAllLevels();
      res.json(levels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });
  
  app.get("/api/sections/:sectionId/levels", isAuthenticated, async (req, res) => {
    try {
      // Now returning all levels since they're no longer tied to sections
      const levels = await storage.getAllLevels();
      res.json(levels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });
  
  app.get("/api/levels", isAuthenticated, async (req, res) => {
    try {
      // Get all levels - now using simplified model where levels are independent
      const levels = await storage.getAllLevels();
      
      res.json(levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });
  
  app.post("/api/levels", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const levelData = req.body;
      const newLevel = await storage.createLevel(levelData);
      res.status(201).json(newLevel);
    } catch (error) {
      console.error("Error creating level:", error);
      res.status(500).json({ message: "Failed to create level" });
    }
  });
  
  app.get("/api/levels/:id", isAuthenticated, async (req, res) => {
    try {
      const levelId = parseInt(req.params.id);
      const level = await storage.getLevel(levelId);
      
      if (!level) {
        return res.status(404).json({ message: "Level not found" });
      }
      
      res.json(level);
    } catch (error) {
      console.error("Error fetching level:", error);
      res.status(500).json({ message: "Failed to fetch level" });
    }
  });
  
  app.put("/api/levels/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const levelId = parseInt(req.params.id);
      const levelData = req.body;
      
      // Check if level exists
      const existingLevel = await storage.getLevel(levelId);
      if (!existingLevel) {
        return res.status(404).json({ message: "Level not found" });
      }
      
      // Update level
      const updatedLevel = await storage.updateLevel(levelId, levelData);
      res.json(updatedLevel);
    } catch (error) {
      console.error("Error updating level:", error);
      res.status(500).json({ message: "Failed to update level" });
    }
  });
  
  app.delete("/api/levels/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const levelId = parseInt(req.params.id);
      console.log(`Attempting to delete level with ID: ${levelId}`);
      
      // Check if level exists
      const level = await storage.getLevel(levelId);
      if (!level) {
        console.log(`Level with ID ${levelId} not found for deletion`);
        return res.status(404).json({ message: "Level not found" });
      }
      
      console.log(`Deleting level: ${JSON.stringify(level)}`);
      await storage.deleteLevel(levelId);
      console.log(`Level with ID ${levelId} successfully deleted`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting level:", error);
      res.status(500).json({ message: "Failed to delete level" });
    }
  });
  
  // Course routes
  app.get("/api/levels/:levelId/courses", isAuthenticated, async (req, res) => {
    try {
      const levelId = parseInt(req.params.levelId);
      const courses = await storage.getCoursesByLevel(levelId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      // Get all courses using our new method
      const courses = await storage.getAllCourses();
      
      // Add level names to courses
      const enhancedCourses = await Promise.all(courses.map(async (course) => {
        const level = await storage.getLevel(course.levelId);
        return {
          ...course,
          levelName: level ? level.name : 'Unknown Level'
        };
      }));
      
      res.json(enhancedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseData = req.body;
      const newCourse = await storage.createCourse(courseData);
      res.status(201).json(newCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.put("/api/courses/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = req.body;
      
      // Check if course exists
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // We'll need to add this method to storage
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // We'll need to add this method to storage
      await storage.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });
  
  // Unit routes
  app.get("/api/courses/:courseId/units", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const units = await storage.getUnitsByCourse(courseId);
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });
  
  app.get("/api/teacher/:teacherId/units", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const units = await storage.getUnitsByTeacher(teacherId);
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });
  
  // Get all units (with role-based filtering)
  app.get("/api/units", isAuthenticated, async (req, res) => {
    try {
      let units;
      
      // Role-based access control
      if (req.user.role === 'student') {
        // Students can only see units they're enrolled in
        const enrollments = await storage.getEnrollmentsByStudent(req.user.id);
        const enrolledCourseIds = enrollments.map(e => e.courseId);
        
        if (enrolledCourseIds.length === 0) {
          return res.json([]); // No enrollments, no units
        }
        
        // Get all units and filter by enrolled courses
        const allUnits = await storage.getAllUnits();
        units = allUnits.filter(unit => enrolledCourseIds.includes(unit.courseId));
      } else if (req.user.role === 'teacher') {
        // Teachers can only see units they're assigned to teach
        units = await storage.getUnitsByTeacher(req.user.id);
      } else if (req.user.role === 'hod') {
        // HODs can see units in their department
        const allUnits = await storage.getAllUnits();
        const departmentUnits = [];
        
        for (const unit of allUnits) {
          const course = await storage.getCourse(unit.courseId);
          if (course && course.departmentId === req.user.departmentId) {
            departmentUnits.push(unit);
          }
        }
        units = departmentUnits;
      } else {
        // Admins and super admins can see all units
        units = await storage.getAllUnits();
      }
      
      // Enhance units with course, level, and teacher information
      const enhancedUnits = await Promise.all(units.map(async (unit) => {
        const course = await storage.getCourse(unit.courseId);
        let teacher = null;
        let level = null;
        
        if (unit.teacherId) {
          teacher = await storage.getUser(unit.teacherId);
        }
        
        if (course && course.levelId) {
          level = await storage.getLevel(course.levelId);
        }
        
        return {
          ...unit,
          courseName: course ? course.name : "Unknown Course",
          levelName: level ? level.name : "Unknown Level",
          teacherName: teacher ? teacher.fullName : null,
          sessionCount: 0, // Will be updated later with actual count
          enrollmentCount: 0 // Will be updated later with student count
        };
      }));
      
      // Get session counts and enrollment counts for each unit
      for (const unit of enhancedUnits) {
        const sessions = await storage.getSessionsByUnit(unit.id);
        unit.sessionCount = sessions.length;
        
        // Calculate enrollment count: students in classes that include this unit's course
        const classes = await storage.getAllClasses();
        const relevantClasses = classes.filter(cls => cls.courseId === unit.courseId);
        
        let totalEnrollments = 0;
        for (const cls of relevantClasses) {
          const enrollments = await storage.getEnrollmentsByClass(cls.id);
          totalEnrollments += enrollments.length;
        }
        unit.enrollmentCount = totalEnrollments;
      }
      
      res.json(enhancedUnits);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });
  
  // Get a specific unit
  app.get("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unit = await storage.getUnit(unitId);
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Get course, level, and teacher information
      const course = await storage.getCourse(unit.courseId);
      let teacher = null;
      let level = null;
      
      if (unit.teacherId) {
        teacher = await storage.getUser(unit.teacherId);
      }
      
      if (course && course.levelId) {
        level = await storage.getLevel(course.levelId);
      }
      
      // Get session count
      const sessions = await storage.getSessionsByUnit(unit.id);
      
      const enhancedUnit = {
        ...unit,
        courseName: course ? course.name : "Unknown Course",
        levelName: level ? level.name : "Unknown Level",
        teacherName: teacher ? teacher.fullName : null,
        sessionCount: sessions.length
      };
      
      res.json(enhancedUnit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unit" });
    }
  });
  
  // Create new unit
  app.post("/api/units", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const { classIds, ...unitData } = req.body;
      const newUnit = await storage.createUnit(unitData);
      
      // If class IDs are provided, assign unit to those classes
      if (classIds && classIds.length > 0) {
        await storage.assignUnitsToClass(classIds[0], [newUnit.id]);
        for (let i = 1; i < classIds.length; i++) {
          await storage.assignUnitsToClass(classIds[i], [newUnit.id]);
        }
      }
      
      res.status(201).json(newUnit);
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });
  
  // Update unit
  app.put("/api/units/:id", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unitData = req.body;
      
      // Get the existing unit
      const existingUnit = await storage.getUnit(unitId);
      if (!existingUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Update the unit
      const updatedUnit = await storage.updateUnit(unitId, unitData);
      res.json(updatedUnit);
    } catch (error) {
      console.error("Error updating unit:", error);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });
  
  // Delete unit
  app.delete("/api/units/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      
      // First check if unit exists
      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      await storage.deleteUnit(unitId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });
  
  // Session routes - Get both unit sessions and schedules
  app.get("/api/units/:unitId/sessions", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      
      // Get schedules for this unit
      const schedules = await storage.getSchedulesByUnit(unitId);
      
      // Generate session instances from schedules for the current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      
      const sessions = [];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      for (const schedule of schedules) {
        // Calculate the date for this schedule's day of week
        const sessionDate = new Date(startOfWeek);
        sessionDate.setDate(startOfWeek.getDate() + schedule.dayOfWeek);
        
        // Create a session instance with proper date formatting
        sessions.push({
          id: schedule.id, // Use schedule ID as session ID
          unitId: schedule.unitId,
          date: sessionDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location,
          dayOfWeek: dayNames[schedule.dayOfWeek],
          isActive: schedule.isActive,
          hasRecordOfWork: false // Default for generated sessions
        });
      }
      
      res.json(sessions);
    } catch (error) {
      console.error("Error generating sessions from schedules:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Create sessions for a specific unit
  app.post("/api/units/:unitId/sessions", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const { dayOfWeek, startTime, endTime, location, repeatWeekly, weeks } = req.body;
      
      // Validate required fields
      if (!dayOfWeek || !startTime || !endTime || !location) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Get active academic term
      let activeTerm = await storage.getActiveAcademicTerm();
      
      // If no active term is found, use the first available term or create a default one
      if (!activeTerm) {
        const terms = await storage.getAllAcademicTerms();
        
        if (terms.length > 0) {
          activeTerm = terms[0];
        } else {
          // Create a default term if none exists
          const defaultTerm = {
            name: "Current Term",
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
            weekCount: 15,
            isActive: true
          };
          
          activeTerm = await storage.createAcademicTerm(defaultTerm);
        }
      }
      
      // Map day string to number
      const dayMapping: Record<string, number> = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2, 
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
      };
      
      // Convert dayOfWeek from string to number
      const dayOfWeekNumber = dayMapping[dayOfWeek as string];
      if (dayOfWeekNumber === undefined) {
        return res.status(400).json({ message: "Invalid day of week" });
      }
      
      // Get term ID
      const termId = activeTerm.id;
      
      // Create a schedule for the recurring session
      const schedule = await storage.createUnitSchedule({
        unitId,
        dayOfWeek: dayOfWeekNumber,
        startTime,
        endTime,
        location,
        isActive: true,
        termId
      });
      
      // Get the day name from the number for display purposes
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      // Return enhanced response for the client
      res.json({
        ...schedule,
        dayOfWeek: dayNames[dayOfWeekNumber], // Convert number back to string for display
        message: "Session created successfully"
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });
  
  app.get("/api/teacher/:teacherId/active-sessions", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const activeSessions = await storage.getActiveSessionsByTeacher(teacherId);
      res.json(activeSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  // Get active sessions for students to mark attendance
  app.get("/api/students/:studentId/active-sessions", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Verify the student is accessing their own data or admin/teacher is accessing
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get student's enrollments
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      
      if (enrolledCourseIds.length === 0) {
        return res.json([]);
      }
      
      // Get all units for enrolled courses with course details
      const allUnits = await storage.getAllUnits();
      const enrolledUnits = allUnits.filter(unit => enrolledCourseIds.includes(unit.courseId));
      
      // Get course details for enrolled units
      const courses = await storage.getAllCourses();
      const courseMap = new Map(courses.map(course => [course.id, course]));
      
      // Get all active sessions for enrolled units with unit and course details
      const activeSessions = [];
      for (const unit of enrolledUnits) {
        const sessions = await storage.getSessionsByUnit(unit.id);
        const activeUnitSessions = sessions.filter(session => session.isActive);
        const course = courseMap.get(unit.courseId);
        
        // Add unit and course information to each session
        const sessionsWithDetails = activeUnitSessions.map(session => ({
          ...session,
          unit: {
            id: unit.id,
            name: unit.name,
            code: unit.code,
            course: {
              name: course?.name || 'Unknown Course',
              code: course?.code || 'N/A',
            }
          }
        }));
        
        activeSessions.push(...sessionsWithDetails);
      }
      
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching student active sessions:", error);
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  // Get student's attendance records
  app.get("/api/attendance/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Verify the student is accessing their own data or admin/teacher is accessing
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Enrollment Routes
  app.post("/api/enrollments", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const { studentIds, classId, courseId, termId } = req.body;
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Student IDs are required" });
      }
      
      const enrollments = [];
      for (const studentId of studentIds) {
        const enrollment = await storage.createEnrollment({
          studentId,
          classId,
          courseId,
          termId,
          status: 'active'
        });
        enrollments.push(enrollment);
      }
      
      res.status(201).json(enrollments);
    } catch (error) {
      console.error("Error creating enrollments:", error);
      res.status(500).json({ message: "Failed to create enrollments" });
    }
  });

  app.get("/api/classes/:classId/enrollments", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const enrollments = await storage.getEnrollmentsByClass(classId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching class enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  app.post("/api/unit-sessions", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      console.log("Received request body:", req.body);
      
      // Parse the date and time strings carefully
      const dateStr = req.body.date;
      const startTimeStr = req.body.startTime;
      const endTimeStr = req.body.endTime;
      
      // Create proper Date objects
      const sessionDate = new Date(dateStr);
      const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
      const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);
      
      const sessionData = {
        unitId: parseInt(req.body.unitId),
        date: sessionDate,
        startTime: startDateTime,
        endTime: endDateTime,
        location: req.body.location || null,
        weekNumber: 1,
        termId: 1,
        isActive: true,
        isCancelled: false
      };
      
      console.log("Processed session data:", sessionData);
      console.log("Date types:", {
        date: typeof sessionData.date,
        startTime: typeof sessionData.startTime,
        endTime: typeof sessionData.endTime,
        dateValid: sessionData.date instanceof Date,
        startTimeValid: sessionData.startTime instanceof Date,
        endTimeValid: sessionData.endTime instanceof Date
      });
      
      const session = await storage.createUnitSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(400).json({ message: "Invalid session data", errors: error.message });
    }
  });
  
  app.patch("/api/sessions/:sessionId/status", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const updatedSession = await storage.updateUnitSessionStatus(sessionId, isActive);
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session status" });
    }
  });

  // Alternative route for unit sessions status update
  app.patch("/api/unit-sessions/:sessionId/status", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const updatedSession = await storage.updateUnitSessionStatus(sessionId, isActive);
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating unit session status:", error);
      res.status(500).json({ message: "Failed to update session status" });
    }
  });
  
  // Attendance routes
  app.get("/api/sessions/:sessionId/attendance", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const attendanceRecords = await storage.getAttendanceBySession(sessionId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });
  
  app.get("/api/students/:studentId/attendance", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Get students for a specific session (for teacher attendance management)
  app.get("/api/sessions/:sessionId/students", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const students = await storage.getStudentsBySession(sessionId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching session students:", error);
      res.status(500).json({ message: "Failed to fetch students for session" });
    }
  });

  // Bulk attendance marking for teachers
  app.post("/api/attendance/bulk", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const { sessionId, attendance } = req.body;
      
      if (!sessionId || !Array.isArray(attendance)) {
        return res.status(400).json({ message: "Invalid bulk attendance data" });
      }

      const results = [];
      for (const record of attendance) {
        const { studentId, isPresent } = record;
        
        if (typeof studentId !== 'number' || typeof isPresent !== 'boolean') {
          continue; // Skip invalid records
        }

        try {
          const attendanceRecord = await storage.markAttendance({
            studentId,
            sessionId,
            isPresent,
            markedAt: new Date(),
          });
          results.push(attendanceRecord);
        } catch (error) {
          console.error(`Error marking attendance for student ${studentId}:`, error);
        }
      }

      res.status(201).json({ 
        message: `Successfully marked attendance for ${results.length} students`,
        records: results 
      });
    } catch (error) {
      console.error("Error with bulk attendance:", error);
      res.status(500).json({ message: "Failed to mark bulk attendance" });
    }
  });
  
  app.post("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      
      // Verify the session is active for students marking their own attendance
      if (attendanceData.markedBySelf) {
        const session = await storage.getUnitSession(attendanceData.sessionId);
        if (!session || !session.isActive) {
          return res.status(400).json({ message: "Cannot mark attendance for inactive session" });
        }
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create attendance record" });
      }
    }
  });
  
  app.patch("/api/attendance/:attendanceId", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const attendanceId = parseInt(req.params.attendanceId);
      const updates = req.body;
      
      const updatedAttendance = await storage.updateAttendance(attendanceId, {
        ...updates,
        updatedBy: (req.user as Express.User).id,
        updatedAt: new Date()
      });
      
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });
  
  // Record of Work routes
  app.get("/api/sessions/:sessionId/record", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const record = await storage.getRecordOfWorkBySession(sessionId);
      
      if (!record) {
        return res.status(404).json({ message: "Record not found for this session" });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch record of work" });
    }
  });
  
  app.post("/api/record-of-work", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const recordData = insertRecordOfWorkSchema.parse(req.body);
      
      // Check if a record already exists for this session
      const existingRecord = await storage.getRecordOfWorkBySession(recordData.sessionId);
      if (existingRecord) {
        return res.status(400).json({ message: "A record of work already exists for this session" });
      }
      
      const record = await storage.createRecordOfWork(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid record data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create record of work" });
      }
    }
  });
  
  app.patch("/api/record-of-work/:recordId", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const recordId = parseInt(req.params.recordId);
      const updates = req.body;
      
      const updatedRecord = await storage.updateRecordOfWork(recordId, updates);
      if (!updatedRecord) {
        return res.status(404).json({ message: "Record of work not found" });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to update record of work" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      // Get all enrollments with student and class information
      const enrollments = await storage.getAllEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/classes/:classId/enrollments", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const enrollments = await storage.getEnrollmentsByClass(classId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching class enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const { studentIds, classId, courseId, termId } = req.body;
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Student IDs array is required" });
      }

      const enrollments = [];
      const errors = [];
      
      for (const studentId of studentIds) {
        // Check if student is already enrolled in ANY class (one-to-one relationship)
        const existingEnrollments = await storage.getEnrollmentsByStudent(studentId);
        const hasActiveEnrollment = existingEnrollments.some(e => e.status === 'active');
        
        if (hasActiveEnrollment) {
          // Get student name for better error message
          const student = await storage.getUser(studentId);
          const existingClass = existingEnrollments.find(e => e.status === 'active');
          errors.push(`${student?.fullName || `Student ID ${studentId}`} is already enrolled in another class`);
          continue;
        }
        
        // Check if student is already enrolled in this specific class
        const alreadyEnrolledInThisClass = existingEnrollments.some(e => e.classId === classId);
        if (alreadyEnrolledInThisClass) {
          const student = await storage.getUser(studentId);
          errors.push(`${student?.fullName || `Student ID ${studentId}`} is already enrolled in this class`);
          continue;
        }
        
        // Create enrollment if no conflicts
        const enrollment = await storage.createEnrollment({
          studentId,
          classId,
          courseId,
          termId,
          status: 'active'
        });
        enrollments.push(enrollment);
      }

      // Return results with any errors
      if (errors.length > 0 && enrollments.length === 0) {
        // All enrollments failed
        return res.status(400).json({ 
          message: "Enrollment failed", 
          errors: errors 
        });
      } else if (errors.length > 0) {
        // Some enrollments succeeded, some failed
        return res.status(207).json({ 
          message: "Partial enrollment completed",
          enrollments: enrollments,
          errors: errors 
        });
      } else {
        // All enrollments succeeded
        res.status(201).json(enrollments);
      }
    } catch (error) {
      console.error("Error creating enrollments:", error);
      res.status(500).json({ message: "Failed to create enrollments" });
    }
  });

  app.delete("/api/enrollments/:enrollmentId", isAuthenticated, hasRole(["admin", "super_admin", "hod"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      // Implementation would update status to 'withdrawn' instead of deleting
      res.status(204).send();
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Failed to remove enrollment" });
    }
  });

  // Academic Terms routes
  app.get("/api/academic-terms", isAuthenticated, async (req, res) => {
    try {
      console.log("Academic terms route hit - fetching from storage");
      const terms = await storage.getAllAcademicTerms();
      console.log("Academic terms retrieved:", terms);
      res.setHeader('Content-Type', 'application/json');
      res.json(terms);
    } catch (error) {
      console.error("Error fetching academic terms:", error);
      res.status(500).json({ message: "Failed to fetch academic terms" });
    }
  });

  app.post("/api/academic-terms", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const termData = req.body;
      console.log("Raw request body:", termData);
      console.log("Start date type:", typeof termData.startDate, "Value:", termData.startDate);
      console.log("End date type:", typeof termData.endDate, "Value:", termData.endDate);
      
      // Convert ISO strings to Date objects for Drizzle ORM
      const processedData = {
        name: termData.name,
        startDate: new Date(termData.startDate),
        endDate: new Date(termData.endDate),
        weekCount: parseInt(termData.weekCount),
        isActive: Boolean(termData.isActive),
      };
      
      console.log("Processed data:", processedData);
      const newTerm = await storage.createAcademicTerm(processedData);
      res.status(201).json(newTerm);
    } catch (error) {
      console.error("Error creating academic term:", error);
      res.status(500).json({ message: "Failed to create academic term" });
    }
  });

  app.patch("/api/academic-terms/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      const updates = req.body;
      
      console.log(`Updating term ${termId} with updates:`, updates);
      
      // If activating a term, first deactivate all other terms
      if (updates.isActive === true) {
        console.log("Activating term, deactivating others...");
        // First, deactivate all terms
        const allTerms = await storage.getAllAcademicTerms();
        console.log("All terms before deactivation:", allTerms.map(t => ({ id: t.id, name: t.name, isActive: t.isActive })));
        
        for (const term of allTerms) {
          if (term.id !== termId && term.isActive) {
            console.log(`Deactivating term ${term.id} (${term.name})`);
            await storage.updateAcademicTerm(term.id, { isActive: false });
          }
        }
      }
      
      const updatedTerm = await storage.updateAcademicTerm(termId, updates);
      console.log("Updated term result:", updatedTerm);
      
      if (!updatedTerm) {
        return res.status(404).json({ message: "Academic term not found" });
      }
      
      res.json(updatedTerm);
    } catch (error) {
      console.error("Error updating academic term:", error);
      res.status(500).json({ message: "Failed to update academic term" });
    }
  });

  // Class management routes
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      console.log("Classes API called - starting enrollment count calculation");
      const classes = await storage.getAllClasses();
      console.log(`Found ${classes.length} classes to process`);
      
      // Manually calculate enrollment count for each class
      const classesWithEnrollmentCount = await Promise.all(classes.map(async (classItem) => {
        try {
          const enrollments = await storage.getEnrollmentsByClass(classItem.id);
          const enrollmentCount = enrollments.length;
          
          console.log(`✓ Class ${classItem.name} (ID: ${classItem.id}) has ${enrollmentCount} enrolled students`);
          
          return {
            ...classItem,
            currentStudents: enrollmentCount
          };
        } catch (enrollmentError) {
          console.error(`Error getting enrollments for class ${classItem.id}:`, enrollmentError);
          return {
            ...classItem,
            currentStudents: 0
          };
        }
      }));
      
      console.log("Enrollment count calculation completed successfully");
      
      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(classesWithEnrollmentCount);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const { unitIds, ...classData } = req.body;
      
      // Convert date strings to Date objects if needed
      if (typeof classData.startDate === 'string') {
        classData.startDate = new Date(classData.startDate);
      }
      if (typeof classData.endDate === 'string') {
        classData.endDate = new Date(classData.endDate);
      }
      
      const newClass = await storage.createClass(classData);
      
      // Assign units to the class if any are provided
      if (unitIds && Array.isArray(unitIds) && unitIds.length > 0) {
        await storage.assignUnitsToClass(newClass.id, unitIds);
      }
      
      res.status(201).json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.get("/api/classes/:id", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(classData);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  app.patch("/api/classes/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const updates = req.body;
      
      // Convert date strings to Date objects if needed
      if (typeof updates.startDate === 'string') {
        updates.startDate = new Date(updates.startDate);
      }
      if (typeof updates.endDate === 'string') {
        updates.endDate = new Date(updates.endDate);
      }
      
      const updatedClass = await storage.updateClass(classId, updates);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      await storage.deleteClass(classId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Get units assigned to a class
  app.get("/api/classes/:id/units", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const units = await storage.getUnitsForClass(classId);
      res.json(units);
    } catch (error) {
      console.error("Error fetching class units:", error);
      res.status(500).json({ message: "Failed to fetch class units" });
    }
  });

  // Unit Schedules routes - for weekly recurring sessions (day-based)
  app.get("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getAllUnitSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });
  
  app.get("/api/teachers/:teacherId/schedules", isAuthenticated, async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      
      // Get units taught by this teacher
      const units = await storage.getUnitsByTeacher(teacherId);
      
      // Get schedules for these units
      let schedules: any[] = [];
      for (const unit of units) {
        const unitSchedules = await storage.getSchedulesByUnit(unit.id);
        schedules = [...schedules, ...unitSchedules];
      }
      
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching teacher schedules:", error);
      res.status(500).json({ message: "Failed to fetch teacher schedules" });
    }
  });
  
  app.get("/api/units/:unitId/schedules", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const schedules = await storage.getSchedulesByUnit(unitId);
      
      // Map day numbers to names for display
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      // Transform schedules for display
      const formattedSchedules = schedules.map(schedule => ({
        ...schedule,
        dayOfWeek: dayNames[schedule.dayOfWeek], // Convert number to name
        type: "recurring"
      }));
      
      res.json(formattedSchedules);
    } catch (error) {
      console.error("Error fetching unit schedules:", error);
      res.status(500).json({ message: "Failed to fetch unit schedules" });
    }
  });
  
  app.post("/api/schedules", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleData = insertUnitScheduleSchema.parse(req.body);
      
      // Create schedule
      const newSchedule = await storage.createUnitSchedule(scheduleData);
      
      res.status(201).json(newSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      } else {
        console.error("Error creating schedule:", error);
        res.status(500).json({ message: "Failed to create schedule" });
      }
    }
  });
  
  app.patch("/api/schedules/:scheduleId/status", isAuthenticated, hasRole(["teacher", "hod", "admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const updatedSchedule = await storage.updateUnitScheduleStatus(scheduleId, isActive);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error updating schedule status:", error);
      res.status(500).json({ message: "Failed to update schedule status" });
    }
  });
  
  app.delete("/api/schedules/:scheduleId", isAuthenticated, hasRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      
      // Check if schedule exists
      const schedule = await storage.getUnitSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      await storage.deleteUnitSchedule(scheduleId);
      res.status(200).json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
