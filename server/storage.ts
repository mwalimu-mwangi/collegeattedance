import { users, units, departments, sections, levels, courses, unitSessions, classes, enrollments, attendance, recordsOfWork, academicTerms, unitSchedules, unitClassAssignments } from "@shared/schema";
import { type User, type InsertUser, type Department, type InsertDepartment, type Section, type InsertSection, type Level, type InsertLevel, type Course, type InsertCourse, type Unit, type InsertUnit, type UnitSession, type InsertUnitSession, type Class, type InsertClass, type Enrollment, type InsertEnrollment, type Attendance, type InsertAttendance, type RecordOfWork, type InsertRecordOfWork, type AcademicTerm, type InsertAcademicTerm, type UnitSchedule, type InsertUnitSchedule, Role } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { pool } from "./db";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined>;
  getUserByStaffId(staffId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: Role): Promise<User[]>;
  
  // Department
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  getAllDepartments(): Promise<Department[]>;
  updateDepartment(id: number, updates: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<void>;
  
  // Section
  getSection(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  getSectionsByDepartment(departmentId: number): Promise<Section[]>;
  updateSection(id: number, updates: Partial<Section>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<void>;
  
  // Level
  getLevel(id: number): Promise<Level | undefined>;
  createLevel(level: InsertLevel): Promise<Level>;
  getAllLevels(): Promise<Level[]>;
  updateLevel(id: number, updates: Partial<Level>): Promise<Level | undefined>;
  deleteLevel(id: number): Promise<void>;
  
  // Course
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCoursesByLevel(levelId: number): Promise<Course[]>;
  getCoursesByDepartment(departmentId: number): Promise<Course[]>;
  updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  
  // Unit
  getUnit(id: number): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  getUnitsByCourse(courseId: number): Promise<Unit[]>;
  getUnitsByTeacher(teacherId: number): Promise<Unit[]>;
  updateUnit(id: number, updates: Partial<Unit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<void>;
  getAllUnits(): Promise<Unit[]>;
  
  // Class
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  getAllClasses(): Promise<Class[]>;
  getClassesByCourse(courseId: number): Promise<Class[]>;
  getClassesByTerm(termId: number): Promise<Class[]>;
  updateClass(id: number, updates: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<void>;
  
  // Academic Terms
  getAcademicTerm(id: number): Promise<AcademicTerm | undefined>;
  createAcademicTerm(term: InsertAcademicTerm): Promise<AcademicTerm>;
  getAllAcademicTerms(): Promise<AcademicTerm[]>;
  getActiveAcademicTerm(): Promise<AcademicTerm | undefined>;
  updateAcademicTerm(id: number, updates: Partial<AcademicTerm>): Promise<AcademicTerm | undefined>;
  
  // Unit Schedules (Weekly recurring sessions)
  getUnitSchedule(id: number): Promise<UnitSchedule | undefined>;
  createUnitSchedule(schedule: InsertUnitSchedule): Promise<UnitSchedule>;
  getSchedulesByUnit(unitId: number): Promise<UnitSchedule[]>;
  getAllUnitSchedules(): Promise<UnitSchedule[]>;
  updateUnitScheduleStatus(id: number, isActive: boolean): Promise<UnitSchedule | undefined>;
  deleteUnitSchedule(id: number): Promise<void>;
  
  // UnitSession
  getUnitSession(id: number): Promise<UnitSession | undefined>;
  createUnitSession(session: InsertUnitSession): Promise<UnitSession>;
  getSessionsByUnit(unitId: number): Promise<UnitSession[]>;
  getActiveSessionsByTeacher(teacherId: number): Promise<UnitSession[]>;
  updateUnitSessionStatus(id: number, isActive: boolean): Promise<UnitSession | undefined>;
  
  // Enrollment
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByClass(classId: number): Promise<Enrollment[]>;
  getAllEnrollments(): Promise<Enrollment[]>;
  
  // Attendance
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceBySession(sessionId: number): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Record of Work
  getRecordOfWork(id: number): Promise<RecordOfWork | undefined>;
  getRecordOfWorkBySession(sessionId: number): Promise<RecordOfWork | undefined>;
  createRecordOfWork(record: InsertRecordOfWork): Promise<RecordOfWork>;
  updateRecordOfWork(id: number, updates: Partial<RecordOfWork>): Promise<RecordOfWork | undefined>;
  
  // Unit-Class Assignments
  assignUnitsToClass(classId: number, unitIds: number[]): Promise<void>;
  getUnitsForClass(classId: number): Promise<Unit[]>;
  getClassesForUnit(unitId: number): Promise<Class[]>;
  
  // Session Store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create session store with cleanup enabled
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      pruneSessionInterval: 60 // Prune expired sessions every minute
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.admissionNumber, admissionNumber));
    return user;
  }

  async getUserByStaffId(staffId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.staffId, staffId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values([insertUser as any]).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }
  
  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }
  
  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }
  
  async getAllDepartments(): Promise<Department[]> {
    return db.select().from(departments);
  }
  
  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department | undefined> {
    const [updated] = await db.update(departments)
      .set(updates)
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }
  
  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }
  
  // Section methods
  async getSection(id: number): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }
  
  async createSection(insertSection: InsertSection): Promise<Section> {
    const [section] = await db.insert(sections).values(insertSection).returning();
    return section;
  }
  
  async getSectionsByDepartment(departmentId: number): Promise<Section[]> {
    return db.select().from(sections).where(eq(sections.departmentId, departmentId));
  }
  
  async updateSection(id: number, updates: Partial<Section>): Promise<Section | undefined> {
    const [updated] = await db.update(sections)
      .set(updates)
      .where(eq(sections.id, id))
      .returning();
    return updated;
  }
  
  async deleteSection(id: number): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }
  
  // Level methods
  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }
  
  async createLevel(level: InsertLevel): Promise<Level> {
    const [created] = await db.insert(levels).values(level).returning();
    return created;
  }
  
  async getAllLevels(): Promise<Level[]> {
    return db.select().from(levels);
  }
  
  async updateLevel(id: number, updates: Partial<Level>): Promise<Level | undefined> {
    const [updated] = await db.update(levels)
      .set(updates)
      .where(eq(levels.id, id))
      .returning();
    return updated;
  }
  
  async deleteLevel(id: number): Promise<void> {
    await db.delete(levels).where(eq(levels.id, id));
  }
  
  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }
  
  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }
  
  async getCoursesByLevel(levelId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.levelId, levelId));
  }

  async getCoursesByDepartment(departmentId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.departmentId, departmentId));
  }
  
  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<void> {
    await db
      .delete(courses)
      .where(eq(courses.id, id));
  }
  
  // Unit methods
  async getUnit(id: number): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }
  
  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [created] = await db.insert(units).values(unit).returning();
    return created;
  }
  
  async getUnitsByCourse(courseId: number): Promise<Unit[]> {
    return db.select().from(units).where(eq(units.courseId, courseId));
  }
  
  async getUnitsByTeacher(teacherId: number): Promise<Unit[]> {
    return db.select().from(units).where(eq(units.teacherId, teacherId));
  }
  
  async updateUnit(id: number, updates: Partial<Unit>): Promise<Unit | undefined> {
    const [updatedUnit] = await db
      .update(units)
      .set(updates)
      .where(eq(units.id, id))
      .returning();
    return updatedUnit;
  }
  
  async deleteUnit(id: number): Promise<void> {
    await db
      .delete(units)
      .where(eq(units.id, id));
  }
  
  async getAllUnits(): Promise<Unit[]> {
    return await db
      .select()
      .from(units);
  }
  
  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return newClass;
  }

  async getAllClasses(): Promise<Class[]> {
    const result = await db.select().from(classes);
    
    // Calculate status and enrollment count based on current date and actual enrollments
    const now = new Date();
    const classesWithCounts = await Promise.all(result.map(async (classItem) => {
      // Get enrollment count for this class
      const enrollmentRecords = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.classId, classItem.id));
      
      const enrollmentCount = enrollmentRecords.length;
      console.log(`Class ${classItem.name} (ID: ${classItem.id}) has ${enrollmentCount} enrolled students`);
      
      return {
        ...classItem,
        status: this.calculateClassStatus(classItem.startDate, classItem.endDate, now),
        currentStudents: enrollmentCount
      };
    }));
    
    return classesWithCounts;
  }

  private calculateClassStatus(startDate: Date, endDate: Date, currentDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(currentDate);

    if (current < start) {
      return 'upcoming';
    } else if (current >= start && current <= end) {
      return 'active';
    } else {
      return 'completed';
    }
  }

  async getClassesByCourse(courseId: number): Promise<Class[]> {
    const result = await db.select().from(classes).where(eq(classes.courseId, courseId));
    return result;
  }

  async getClassesByTerm(termId: number): Promise<Class[]> {
    const result = await db.select().from(classes).where(eq(classes.termId, termId));
    return result;
  }

  async updateClass(id: number, updates: Partial<Class>): Promise<Class | undefined> {
    const [updatedClass] = await db
      .update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updatedClass || undefined;
  }

  async deleteClass(id: number): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }
  
  // Academic Terms methods
  async getAcademicTerm(id: number): Promise<AcademicTerm | undefined> {
    const [term] = await db.select().from(academicTerms).where(eq(academicTerms.id, id));
    return term;
  }
  
  async createAcademicTerm(term: InsertAcademicTerm): Promise<AcademicTerm> {
    const [newTerm] = await db.insert(academicTerms).values(term).returning();
    return newTerm;
  }
  
  async getAllAcademicTerms(): Promise<AcademicTerm[]> {
    return await db.select().from(academicTerms);
  }
  
  async getActiveAcademicTerm(): Promise<AcademicTerm | undefined> {
    const [term] = await db.select().from(academicTerms).where(eq(academicTerms.isActive, true));
    return term;
  }
  
  async updateAcademicTerm(id: number, updates: Partial<AcademicTerm>): Promise<AcademicTerm | undefined> {
    const [updatedTerm] = await db
      .update(academicTerms)
      .set(updates)
      .where(eq(academicTerms.id, id))
      .returning();
    return updatedTerm;
  }
  
  // Unit Schedules methods
  async getUnitSchedule(id: number): Promise<UnitSchedule | undefined> {
    const [schedule] = await db.select().from(unitSchedules).where(eq(unitSchedules.id, id));
    return schedule;
  }
  
  async createUnitSchedule(schedule: InsertUnitSchedule): Promise<UnitSchedule> {
    const [newSchedule] = await db.insert(unitSchedules).values(schedule).returning();
    return newSchedule;
  }
  
  async getSchedulesByUnit(unitId: number): Promise<UnitSchedule[]> {
    return await db.select().from(unitSchedules).where(eq(unitSchedules.unitId, unitId));
  }
  
  async getAllUnitSchedules(): Promise<UnitSchedule[]> {
    const schedules = await db.select().from(unitSchedules);
    
    // Join with units to get unit names and codes
    const result = await Promise.all(schedules.map(async (schedule) => {
      const [unit] = await db.select().from(units).where(eq(units.id, schedule.unitId));
      const [term] = await db.select().from(academicTerms).where(eq(academicTerms.id, schedule.termId));
      
      return {
        ...schedule,
        unitName: unit?.name || "Unknown Unit",
        unitCode: unit?.code || "Unknown",
        termName: term?.name || "Unknown Term"
      };
    }));
    
    return result;
  }
  
  async updateUnitScheduleStatus(id: number, isActive: boolean): Promise<UnitSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(unitSchedules)
      .set({ isActive })
      .where(eq(unitSchedules.id, id))
      .returning();
    return updatedSchedule;
  }
  
  async deleteUnitSchedule(id: number): Promise<void> {
    await db.delete(unitSchedules).where(eq(unitSchedules.id, id));
  }
  
  // UnitSession methods
  async getUnitSession(id: number): Promise<UnitSession | undefined> {
    const [session] = await db.select().from(unitSessions).where(eq(unitSessions.id, id));
    return session;
  }
  
  async createUnitSession(session: InsertUnitSession): Promise<UnitSession> {
    const [created] = await db.insert(unitSessions).values(session).returning();
    return created;
  }
  
  async getSessionsByUnit(unitId: number): Promise<UnitSession[]> {
    return db.select().from(unitSessions).where(eq(unitSessions.unitId, unitId));
  }
  
  async getActiveSessionsByTeacher(teacherId: number): Promise<UnitSession[]> {
    const result = await db.select({
      session: unitSessions
    })
      .from(unitSessions)
      .innerJoin(units, eq(unitSessions.unitId, units.id))
      .where(eq(units.teacherId, teacherId))
      .where(eq(unitSessions.isActive, true));
    
    return result.map(row => row.session);
  }
  
  async updateUnitSessionStatus(id: number, isActive: boolean): Promise<UnitSession | undefined> {
    const [updated] = await db.update(unitSessions)
      .set({ isActive })
      .where(eq(unitSessions.id, id))
      .returning();
    return updated;
  }
  
  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }
  
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    return created;
  }
  
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }
  
  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollmentsByClass(classId: number): Promise<Enrollment[]> {
    const results = await db.select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      classId: enrollments.classId,
      courseId: enrollments.courseId,
      termId: enrollments.termId,
      enrollmentDate: enrollments.enrollmentDate,
      status: enrollments.status,
      finalGrade: enrollments.finalGrade,
      createdAt: enrollments.createdAt,
      studentName: users.fullName,
      studentUsername: users.username,
      studentEmail: users.email
    })
    .from(enrollments)
    .leftJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.classId, classId));
    return results as any[];
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    const results = await db.select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      classId: enrollments.classId,
      courseId: enrollments.courseId,
      termId: enrollments.termId,
      enrollmentDate: enrollments.enrollmentDate,
      status: enrollments.status,
      finalGrade: enrollments.finalGrade,
      createdAt: enrollments.createdAt,
      studentName: users.fullName,
      studentUsername: users.username,
      studentEmail: users.email
    })
    .from(enrollments)
    .leftJoin(users, eq(enrollments.studentId, users.id));
    return results as any[];
  }
  
  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record;
  }
  
  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(record).returning();
    return created;
  }
  
  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }
  
  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    const results = await db.select({
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      isPresent: attendance.isPresent,
      markedBySelf: attendance.markedBySelf,
      markedByTeacher: attendance.markedByTeacher,
      markedAt: attendance.markedAt,
      session: {
        id: unitSessions.id,
        unitId: unitSessions.unitId,
        date: unitSessions.date,
        startTime: unitSessions.startTime,
        endTime: unitSessions.endTime,
        location: unitSessions.location,
        isActive: unitSessions.isActive,
        unit: {
          id: units.id,
          name: units.name,
          code: units.code,
          course: {
            name: courses.name,
            code: courses.code,
          }
        }
      }
    })
    .from(attendance)
    .leftJoin(unitSessions, eq(attendance.sessionId, unitSessions.id))
    .leftJoin(units, eq(unitSessions.unitId, units.id))
    .leftJoin(courses, eq(units.courseId, courses.id))
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(unitSessions.date));
    
    return results as any[];
  }
  
  async updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const [updated] = await db.update(attendance)
      .set(updates)
      .where(eq(attendance.id, id))
      .returning();
    return updated;
  }
  
  // Record of Work methods
  async getRecordOfWork(id: number): Promise<RecordOfWork | undefined> {
    const [record] = await db.select().from(recordsOfWork).where(eq(recordsOfWork.id, id));
    return record;
  }
  
  async getRecordOfWorkBySession(sessionId: number): Promise<RecordOfWork | undefined> {
    const [record] = await db.select().from(recordsOfWork).where(eq(recordsOfWork.sessionId, sessionId));
    return record;
  }
  
  async createRecordOfWork(record: InsertRecordOfWork): Promise<RecordOfWork> {
    const [created] = await db.insert(recordsOfWork).values(record).returning();
    return created;
  }
  
  async updateRecordOfWork(id: number, updates: Partial<RecordOfWork>): Promise<RecordOfWork | undefined> {
    const [updated] = await db.update(recordsOfWork)
      .set(updates)
      .where(eq(recordsOfWork.id, id))
      .returning();
    return updated;
  }

  // Unit-Class Assignment methods
  async assignUnitsToClass(classId: number, unitIds: number[]): Promise<void> {
    const assignments = unitIds.map(unitId => ({
      classId,
      unitId
    }));
    
    await db.insert(unitClassAssignments).values(assignments);
  }

  async getUnitsForClass(classId: number): Promise<Unit[]> {
    const results = await db
      .select({
        unit: units
      })
      .from(unitClassAssignments)
      .innerJoin(units, eq(unitClassAssignments.unitId, units.id))
      .where(eq(unitClassAssignments.classId, classId));
    
    return results.map(r => r.unit);
  }

  async getClassesForUnit(unitId: number): Promise<Class[]> {
    const results = await db
      .select({
        class: classes
      })
      .from(unitClassAssignments)
      .innerJoin(classes, eq(unitClassAssignments.classId, classes.id))
      .where(eq(unitClassAssignments.unitId, unitId));
    
    return results.map(r => r.class);
  }

  async getStudentsBySession(sessionId: number): Promise<any[]> {
    console.log(`Getting students for session ID: ${sessionId}`);
    
    // Get the unit ID for this session
    const sessionResult = await db
      .select({ unitId: unitSessions.unitId })
      .from(unitSessions)
      .where(eq(unitSessions.id, sessionId))
      .limit(1);

    console.log(`Session result:`, sessionResult);

    if (sessionResult.length === 0) {
      console.log(`No session found with ID: ${sessionId}`);
      return [];
    }

    const unitId = sessionResult[0].unitId;
    console.log(`Found unit ID: ${unitId} for session: ${sessionId}`);

    // Get all classes assigned to this unit
    const classResults = await db
      .select({ classId: unitClassAssignments.classId })
      .from(unitClassAssignments)
      .where(eq(unitClassAssignments.unitId, unitId));

    console.log(`Class results for unit ${unitId}:`, classResults);

    if (classResults.length === 0) {
      console.log(`No classes assigned to unit: ${unitId}`);
      return [];
    }

    const classIds = classResults.map(r => r.classId);
    console.log(`Class IDs: ${classIds}`);

    // Get all students enrolled in these classes
    const studentResults = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        class: {
          id: classes.id,
          name: classes.name
        }
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .where(and(
        inArray(enrollments.classId, classIds),
        eq(enrollments.status, 'active')
      ));

    console.log(`Student results for session ${sessionId}:`, studentResults);
    return studentResults;
  }

  async markAttendance(data: { studentId: number; sessionId: number; isPresent: boolean; markedAt: Date }): Promise<any> {
    // Check if attendance already exists
    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, data.studentId),
        eq(attendance.sessionId, data.sessionId)
      ))
      .limit(1);

    if (existingAttendance.length > 0) {
      // Update existing attendance
      const [updated] = await db
        .update(attendance)
        .set({
          isPresent: data.isPresent,
          markedAt: data.markedAt
        })
        .where(and(
          eq(attendance.studentId, data.studentId),
          eq(attendance.sessionId, data.sessionId)
        ))
        .returning();

      return updated;
    } else {
      // Create new attendance record
      const [created] = await db
        .insert(attendance)
        .values({
          studentId: data.studentId,
          sessionId: data.sessionId,
          isPresent: data.isPresent,
          markedAt: data.markedAt
        })
        .returning();

      return created;
    }
  }
}

export const storage = new DatabaseStorage();