import { useState, useEffect } from "react";
import { exportToExcel } from "@/services/report-export";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DownloadCloud, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Calendar,
  Users,
  ChevronDown,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

// Mock data interfaces
interface Student {
  id: number;
  fullName: string;
  registrationNumber: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  levelId: number;
  levelName?: string;
}

interface Unit {
  id: number;
  name: string;
  code: string;
  courseId: number;
  courseName?: string;
}

interface UnitSession {
  id: number;
  unitId: number;
  unitName?: string;
  unitCode?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  weekNumber: number;
}

interface AttendanceRecord {
  id: number;
  sessionId: number;
  studentId: number;
  studentName: string;
  registrationNumber: string;
  status: "present" | "absent" | "excused";
  timestamp: string;
  notes?: string;
}

export default function AttendanceReports() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "excel" | null>(null);
  
  // Filter states
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [sessions, setSessions] = useState<UnitSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Report data
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
    presentPercentage: 0,
    absentPercentage: 0,
    excusedPercentage: 0
  });
  
  // Mock data
  const mockCourses: Course[] = [
    { id: 1, name: "Bachelor of Computer Science", code: "BCS", levelId: 1, levelName: "Year 1" },
    { id: 2, name: "Bachelor of Business Administration", code: "BBA", levelId: 2, levelName: "Year 2" }
  ];
  
  const mockUnits: Unit[] = [
    { id: 1, name: "Introduction to Programming", code: "CS101", courseId: 1, courseName: "Bachelor of Computer Science" },
    { id: 2, name: "Data Structures", code: "CS201", courseId: 1, courseName: "Bachelor of Computer Science" },
    { id: 3, name: "Business Ethics", code: "BUS205", courseId: 2, courseName: "Bachelor of Business Administration" }
  ];
  
  const mockStudents: Student[] = [
    { id: 1, fullName: "John Smith", registrationNumber: "BCS/001/21" },
    { id: 2, fullName: "Jane Doe", registrationNumber: "BCS/002/21" },
    { id: 3, fullName: "Robert Johnson", registrationNumber: "BCS/003/21" },
    { id: 4, fullName: "Emily Williams", registrationNumber: "BCS/004/21" },
    { id: 5, fullName: "Michael Brown", registrationNumber: "BBA/001/21" }
  ];
  
  const mockSessions: UnitSession[] = [
    { 
      id: 1, 
      unitId: 1, 
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: "2023-10-15T09:00:00Z",
      startTime: "09:00:00",
      endTime: "11:00:00",
      location: "Room 101",
      weekNumber: 1
    },
    { 
      id: 2, 
      unitId: 1, 
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: "2023-10-22T09:00:00Z",
      startTime: "09:00:00",
      endTime: "11:00:00",
      location: "Room 101",
      weekNumber: 2
    },
    { 
      id: 3, 
      unitId: 2, 
      unitName: "Data Structures",
      unitCode: "CS201",
      date: "2023-10-16T14:00:00Z",
      startTime: "14:00:00",
      endTime: "16:00:00",
      location: "Lab 2",
      weekNumber: 1
    }
  ];
  
  const mockAttendance: AttendanceRecord[] = [
    {
      id: 1,
      sessionId: 1,
      studentId: 1,
      studentName: "John Smith",
      registrationNumber: "BCS/001/21",
      status: "present",
      timestamp: "2023-10-15T09:15:00Z"
    },
    {
      id: 2,
      sessionId: 1,
      studentId: 2,
      studentName: "Jane Doe",
      registrationNumber: "BCS/002/21",
      status: "present",
      timestamp: "2023-10-15T09:10:00Z"
    },
    {
      id: 3,
      sessionId: 1,
      studentId: 3,
      studentName: "Robert Johnson",
      registrationNumber: "BCS/003/21",
      status: "absent",
      timestamp: "2023-10-15T09:00:00Z"
    },
    {
      id: 4,
      sessionId: 1,
      studentId: 4,
      studentName: "Emily Williams",
      registrationNumber: "BCS/004/21",
      status: "excused",
      timestamp: "2023-10-15T09:00:00Z",
      notes: "Medical appointment"
    },
    {
      id: 5,
      sessionId: 2,
      studentId: 1,
      studentName: "John Smith",
      registrationNumber: "BCS/001/21",
      status: "present",
      timestamp: "2023-10-22T09:05:00Z"
    },
    {
      id: 6,
      sessionId: 2,
      studentId: 2,
      studentName: "Jane Doe",
      registrationNumber: "BCS/002/21",
      status: "absent",
      timestamp: "2023-10-22T09:00:00Z"
    },
    {
      id: 7,
      sessionId: 2,
      studentId: 3,
      studentName: "Robert Johnson",
      registrationNumber: "BCS/003/21",
      status: "present",
      timestamp: "2023-10-22T09:12:00Z"
    },
    {
      id: 8,
      sessionId: 2,
      studentId: 4,
      studentName: "Emily Williams",
      registrationNumber: "BCS/004/21",
      status: "present",
      timestamp: "2023-10-22T09:08:00Z"
    },
    {
      id: 9,
      sessionId: 3,
      studentId: 1,
      studentName: "John Smith",
      registrationNumber: "BCS/001/21",
      status: "present",
      timestamp: "2023-10-16T14:05:00Z"
    },
    {
      id: 10,
      sessionId: 3,
      studentId: 2,
      studentName: "Jane Doe",
      registrationNumber: "BCS/002/21",
      status: "present",
      timestamp: "2023-10-16T14:03:00Z"
    }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, fetch data from API
        // const coursesResponse = await fetch("/api/courses");
        // const unitsResponse = await fetch("/api/units");
        // const studentsResponse = await fetch("/api/students");
        // const sessionsResponse = await fetch("/api/sessions");
        
        // Using mock data for now
        setCourses(mockCourses);
        setUnits(mockUnits);
        setStudents(mockStudents);
        setSessions(mockSessions);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filter units when course changes
  useEffect(() => {
    if (selectedCourse) {
      const courseId = parseInt(selectedCourse);
      const filteredUnits = mockUnits.filter(unit => unit.courseId === courseId);
      setUnits(filteredUnits);
      setSelectedUnit("");
    } else {
      setUnits(mockUnits);
    }
  }, [selectedCourse]);
  
  // Filter sessions when unit changes
  useEffect(() => {
    if (selectedUnit) {
      const unitId = parseInt(selectedUnit);
      const filteredSessions = mockSessions.filter(session => session.unitId === unitId);
      setSessions(filteredSessions);
      setSelectedSession("");
    } else {
      setSessions(mockSessions);
    }
  }, [selectedUnit]);
  
  const generateReport = () => {
    // Apply filters
    let filteredAttendance = [...mockAttendance];
    
    // Filter by course and unit
    if (selectedUnit) {
      const unitId = parseInt(selectedUnit);
      const sessionIds = mockSessions
        .filter(session => session.unitId === unitId)
        .map(session => session.id);
      
      filteredAttendance = filteredAttendance.filter(record => 
        sessionIds.includes(record.sessionId)
      );
    } else if (selectedCourse) {
      const courseId = parseInt(selectedCourse);
      const unitIds = mockUnits
        .filter(unit => unit.courseId === courseId)
        .map(unit => unit.id);
        
      const sessionIds = mockSessions
        .filter(session => unitIds.includes(session.unitId))
        .map(session => session.id);
        
      filteredAttendance = filteredAttendance.filter(record => 
        sessionIds.includes(record.sessionId)
      );
    }
    
    // Filter by specific session
    if (selectedSession) {
      const sessionId = parseInt(selectedSession);
      filteredAttendance = filteredAttendance.filter(record => 
        record.sessionId === sessionId
      );
    }
    
    // Filter by student
    if (selectedStudent) {
      const studentId = parseInt(selectedStudent);
      filteredAttendance = filteredAttendance.filter(record => 
        record.studentId === studentId
      );
    }
    
    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      const sessionIdsInRange = mockSessions
        .filter(session => {
          const sessionDate = new Date(session.date);
          return (
            sessionDate >= dateRange.from! && 
            sessionDate <= dateRange.to!
          );
        })
        .map(session => session.id);
        
      filteredAttendance = filteredAttendance.filter(record => 
        sessionIdsInRange.includes(record.sessionId)
      );
    }
    
    // Set filtered data
    setAttendanceData(filteredAttendance);
    
    // Calculate summary statistics
    const uniqueSessionIds = new Set(filteredAttendance.map(record => record.sessionId));
    const uniqueStudentIds = new Set(filteredAttendance.map(record => record.studentId));
    
    const totalRecords = filteredAttendance.length;
    const presentCount = filteredAttendance.filter(record => record.status === "present").length;
    const absentCount = filteredAttendance.filter(record => record.status === "absent").length;
    const excusedCount = filteredAttendance.filter(record => record.status === "excused").length;
    
    setSummaryData({
      totalSessions: uniqueSessionIds.size,
      totalStudents: uniqueStudentIds.size,
      averageAttendance: totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0,
      presentPercentage: totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0,
      absentPercentage: totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(1) : 0,
      excusedPercentage: totalRecords > 0 ? (excusedCount / totalRecords * 100).toFixed(1) : 0
    });
  };
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");
    
    try {
      // For client-side demo, simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, we would use server-side API for PDF generation
      // For now, we'll show a success message as a placeholder
      toast({
        title: "Success",
        description: "PDF report generated successfully!",
      });
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };
  
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportType("excel");
    
    try {
      // Get filter information for the export
      const filterInfo = {
        course: selectedCourse ? courses.find(c => c.id === parseInt(selectedCourse))?.name || "All" : "All",
        unit: selectedUnit ? units.find(u => u.id === parseInt(selectedUnit))?.name || "All" : "All",
        student: selectedStudent ? students.find(s => s.id === parseInt(selectedStudent))?.fullName || "All" : "All",
        dateRange: dateRange?.from && dateRange?.to 
          ? `${format(dateRange.from, "PP")} to ${format(dateRange.to, "PP")}` 
          : "All"
      };
      
      // Call our export service to generate the Excel file
      await exportToExcel(
        attendanceData,
        summaryData,
        filterInfo,
        mockSessions
      );
      
      toast({
        title: "Success",
        description: "Excel report generated successfully!",
      });
      
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), "h:mm a");
    } catch (error) {
      return timeString;
    }
  };
  
  const getSessionDetails = (sessionId: number) => {
    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) return "Unknown Session";
    
    return `${session.unitCode} - Week ${session.weekNumber} (${formatDate(session.date)})`;
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Attendance Reports</h2>
          <p className="text-muted-foreground">
            Generate and export attendance reports with various filters
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>
              Select filters to generate your attendance report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Units</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.code} - {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Session</label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                  disabled={!selectedUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sessions</SelectItem>
                    {sessions.filter(s => !selectedUnit || s.unitId === parseInt(selectedUnit)).map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        Week {session.weekNumber} - {formatDate(session.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.fullName} ({student.registrationNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-end">
                <Button onClick={generateReport} className="w-full">
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {attendanceData.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <h3 className="text-xl font-semibold">Report Results</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting && exportType === "pdf" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as PDF
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  {isExporting && exportType === "excel" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Excel...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export as Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <h4 className="text-2xl font-bold">{summaryData.totalSessions}</h4>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 rounded-full p-3">
                      <Users className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <h4 className="text-2xl font-bold">{summaryData.totalStudents}</h4>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Present</p>
                      <h4 className="text-2xl font-bold">{summaryData.presentPercentage}%</h4>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 rounded-full p-3">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <h4 className="text-2xl font-bold">{summaryData.absentPercentage}%</h4>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  Detailed attendance records based on selected filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Reg. Number</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time Recorded</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No attendance records found for the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.studentName}</TableCell>
                            <TableCell>{record.registrationNumber}</TableCell>
                            <TableCell>{getSessionDetails(record.sessionId)}</TableCell>
                            <TableCell>
                              {record.status === "present" && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Present
                                </span>
                              )}
                              {record.status === "absent" && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Absent
                                </span>
                              )}
                              {record.status === "excused" && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  Excused
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(record.timestamp)} {formatTime(record.timestamp)}</TableCell>
                            <TableCell>{record.notes || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}