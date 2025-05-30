import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const roles = ["super_admin", "admin", "hod", "teacher", "student"] as const;
export type Role = typeof roles[number];

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<Role>().notNull(),
  departmentId: integer("department_id"), // Required for teachers and students
  admissionNumber: text("admission_number").unique(), // For students only
  staffId: text("staff_id").unique(), // For teachers and HODs only
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  departmentId: true,
  admissionNumber: true,
  staffId: true,
});

// Specific schemas for different user types
export const insertStudentSchema = insertUserSchema.extend({
  role: z.literal("student"),
  departmentId: z.number().min(1, "Department is required for students"),
  admissionNumber: z.string().min(1, "Admission number is required for students"),
  staffId: z.undefined(),
});

export const insertTeacherSchema = insertUserSchema.extend({
  role: z.enum(["teacher", "hod"]),
  departmentId: z.number().min(1, "Department is required for teachers"),
  staffId: z.string().min(1, "Staff ID is required for teachers"),
  admissionNumber: z.undefined(),
});

export const insertAdminSchema = insertUserSchema.extend({
  role: z.enum(["super_admin", "admin"]),
  departmentId: z.undefined(),
  admissionNumber: z.undefined(),
  staffId: z.undefined(),
});

// Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  headId: integer("head_id"), // HOD reference
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  code: true,
  headId: true,
});

// Sections (optional)
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  name: true,
  departmentId: true,
});

// Levels
export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertLevelSchema = createInsertSchema(levels).pick({
  name: true,
});

// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  levelId: integer("level_id").notNull(),
  departmentId: integer("department_id").notNull(),
  sectionId: integer("section_id"),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  name: true,
  code: true,
  levelId: true,
  departmentId: true,
  sectionId: true,
});

// Units (subjects)
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id"),
});

export const insertUnitSchema = createInsertSchema(units).pick({
  name: true,
  code: true,
  courseId: true,
  teacherId: true,
});

// Unit-Class assignments (many-to-many relationship)
export const unitClassAssignments = pgTable("unit_class_assignments", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  classId: integer("class_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUnitClassAssignmentSchema = createInsertSchema(unitClassAssignments).pick({
  unitId: true,
  classId: true,
});

// Academic Terms
export const academicTerms = pgTable("academic_terms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  weekCount: integer("week_count").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAcademicTermSchema = createInsertSchema(academicTerms).pick({
  name: true,
  startDate: true,
  endDate: true,
  weekCount: true,
  isActive: true,
});

// Weekly Schedule for Units
export const unitSchedules = pgTable("unit_schedules", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // Format: "HH:MM" (24-hour)
  endTime: text("end_time").notNull(),     // Format: "HH:MM" (24-hour)
  location: text("location"),
  isActive: boolean("is_active").default(true),
  termId: integer("term_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUnitScheduleSchema = createInsertSchema(unitSchedules).pick({
  unitId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  location: true,
  isActive: true,
  termId: true,
});

// Unit Sessions (generated from schedules)
export const unitSessions = pgTable("unit_sessions", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  unitId: integer("unit_id").notNull(),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  weekNumber: integer("week_number").notNull(), // 1-12 for a 12-week term
  termId: integer("term_id").notNull(),
  isActive: boolean("is_active").default(false),
  isCancelled: boolean("is_cancelled").default(false),
});

export const insertUnitSessionSchema = createInsertSchema(unitSessions).pick({
  unitId: true,
  date: true,
  startTime: true,
  endTime: true,
  location: true,
  weekNumber: true,
  termId: true,
  isActive: true,
  isCancelled: true,
});

// Classes for student intake management
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  courseId: integer("course_id").notNull(),
  departmentId: integer("department_id").notNull(),
  sectionId: integer("section_id"),
  levelId: integer("level_id").notNull(),
  termId: integer("term_id").notNull(),
  currentStudents: integer("current_students").default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("upcoming"), // upcoming, active, completed, cancelled
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  code: true,
  courseId: true,
  departmentId: true,
  sectionId: true,
  levelId: true,
  termId: true,
  startDate: true,
  endDate: true,
  status: true,
  description: true,
});

// Student Enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  courseId: integer("course_id").notNull(),
  termId: integer("term_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, completed, dropped, withdrawn
  finalGrade: text("final_grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  classId: true,
  courseId: true,
  termId: true,
  status: true,
  finalGrade: true,
});

// Attendance Records
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  studentId: integer("student_id").notNull(),
  isPresent: boolean("is_present").notNull().default(false),
  markedBySelf: boolean("marked_by_self").notNull().default(false),
  markedByTeacher: boolean("marked_by_teacher").notNull().default(false),
  markedAt: timestamp("marked_at").notNull(),
  updatedBy: integer("updated_by"), // user_id who updated it (if any)
  updatedAt: timestamp("updated_at"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  sessionId: true,
  studentId: true,
  isPresent: true,
  markedBySelf: true,
  markedByTeacher: true,
  markedAt: true,
});

// Record of work
export const recordsOfWork = pgTable("records_of_work", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().unique(),
  topic: text("topic").notNull(),
  subtopics: text("subtopics"),
  description: text("description"),
  resources: text("resources"),
  assignment: text("assignment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertRecordOfWorkSchema = createInsertSchema(recordsOfWork).pick({
  sessionId: true,
  topic: true,
  subtopics: true,
  description: true,
  resources: true,
  assignment: true,
  notes: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type AcademicTerm = typeof academicTerms.$inferSelect;
export type InsertAcademicTerm = z.infer<typeof insertAcademicTermSchema>;

export type UnitSchedule = typeof unitSchedules.$inferSelect;
export type InsertUnitSchedule = z.infer<typeof insertUnitScheduleSchema>;

export type UnitSession = typeof unitSessions.$inferSelect;
export type InsertUnitSession = z.infer<typeof insertUnitSessionSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type RecordOfWork = typeof recordsOfWork.$inferSelect;
export type InsertRecordOfWork = z.infer<typeof insertRecordOfWorkSchema>;
