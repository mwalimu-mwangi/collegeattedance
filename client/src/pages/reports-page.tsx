import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
import { Loader2, FileSpreadsheet, Calendar } from "lucide-react";
import { format } from "date-fns";
import { exportToExcel, prepareAttendanceData } from "@/utils/simplified-export";

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Mock data for demonstration
  const mockUnits = [
    { id: 1, name: "Database Management Systems", code: "DMS101", courseId: 1 },
    { id: 2, name: "Web Development", code: "WD102", courseId: 1 },
    { id: 3, name: "Software Engineering Principles", code: "SEP201", courseId: 2 }
  ];

  const mockCourses = [
    { id: 1, name: "Diploma in Computer Science", code: "DCS", levelId: 1 },
    { id: 2, name: "Diploma in Software Engineering", code: "DSE", levelId: 2 }
  ];

  const mockLevels = [
    { id: 1, name: "Level 3", sectionId: 1 },
    { id: 2, name: "Level 4", sectionId: 1 }
  ];

  const mockSessions = [
    { 
      id: 1, 
      unitId: 1, 
      date: new Date("2023-05-16"), 
      startTime: "09:00", 
      endTime: "11:00", 
      location: "Room 105",
      isActive: false 
    },
    { 
      id: 2, 
      unitId: 1, 
      date: new Date("2023-05-17"), 
      startTime: "09:00", 
      endTime: "11:00", 
      location: "Room 105",
      isActive: false 
    },
    { 
      id: 3, 
      unitId: 2, 
      date: new Date("2023-05-16"), 
      startTime: "11:15", 
      endTime: "13:15", 
      location: "Lab 2",
      isActive: false 
    }
  ];

  const mockStudents = [
    { id: 101, fullName: "Alice Johnson", studentId: "STU101", isPresent: true, markedAt: new Date("2023-05-16T09:15:00") },
    { id: 102, fullName: "Bob Smith", studentId: "STU102", isPresent: true, markedAt: new Date("2023-05-16T09:10:00") },
    { id: 103, fullName: "Charlie Brown", studentId: "STU103", isPresent: false, markedAt: null },
    { id: 104, fullName: "Diana Prince", studentId: "STU104", isPresent: true, markedAt: new Date("2023-05-16T09:05:00") },
    { id: 105, fullName: "Edward Norton", studentId: "STU105", isPresent: true, markedAt: new Date("2023-05-16T09:08:00") }
  ];

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    
    // Simulate loading units
    setUnits(mockUnits);
  }, []);

  // Fetch sessions when unit changes
  useEffect(() => {
    if (selectedUnit) {
      // In a real app, fetch sessions for the selected unit
      const unitId = parseInt(selectedUnit);
      const filteredSessions = mockSessions.filter(session => session.unitId === unitId);
      setSessions(filteredSessions);
      setSelectedSession("");
      setAttendanceData([]);
    } else {
      setSessions([]);
    }
  }, [selectedUnit]);

  // Fetch attendance data when session changes
  useEffect(() => {
    if (selectedSession) {
      // In a real app, fetch attendance records for the selected session
      setAttendanceData(mockStudents);
    } else {
      setAttendanceData([]);
    }
  }, [selectedSession]);

  const handleExportExcel = async () => {
    if (!selectedUnit || !selectedSession) return;
    
    setExportLoading(true);
    try {
      const unitId = parseInt(selectedUnit);
      const sessionId = parseInt(selectedSession);
      
      const unit = mockUnits.find(u => u.id === unitId);
      const course = mockCourses.find(c => c.id === unit?.courseId);
      const level = mockLevels.find(l => l.id === course?.levelId);
      const session = mockSessions.find(s => s.id === sessionId);
      
      if (!unit || !course || !level || !session) {
        throw new Error("Missing data for report generation");
      }
      
      const reportData = prepareAttendanceData(
        unit.name,
        course.name,
        level.name,
        session.date,
        session.startTime,
        session.endTime,
        session.location,
        mockStudents
      );
      
      await exportToExcel(reportData);
      
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("Failed to export Excel. See console for details.");
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">College Attendance System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.fullName}</span>
            <Button variant="outline" size="sm" onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/auth";
            }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Attendance Reports</h2>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
            <CardDescription>
              Select a unit and session to generate attendance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Unit</label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Session</label>
                <Select 
                  value={selectedSession} 
                  onValueChange={setSelectedSession}
                  disabled={!selectedUnit || sessions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={sessions.length > 0 ? "Select a session" : "No sessions available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {format(new Date(session.date), "dd MMM yyyy")} ({session.startTime}-{session.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!selectedSession || exportLoading}
              >
                {exportLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedSession && attendanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Preview</CardTitle>
              <CardDescription>
                Preview of attendance data for the selected session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time Marked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.isPresent 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isPresent ? 'Present' : 'Absent'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.markedAt 
                            ? format(new Date(student.markedAt), 'dd MMM yyyy HH:mm') 
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 bg-slate-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-sm text-slate-500">Total Students</div>
                    <div className="text-lg font-semibold">{attendanceData.length}</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-sm text-slate-500">Present</div>
                    <div className="text-lg font-semibold text-green-600">
                      {attendanceData.filter(s => s.isPresent).length}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-sm text-slate-500">Absent</div>
                    <div className="text-lg font-semibold text-red-600">
                      {attendanceData.filter(s => !s.isPresent).length}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-sm text-slate-500">Attendance Rate</div>
                    <div className="text-lg font-semibold">
                      {Math.round((attendanceData.filter(s => s.isPresent).length / attendanceData.length) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}