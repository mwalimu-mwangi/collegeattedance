import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Save, Users, ClipboardList, FileText, BookOpen } from "lucide-react";

interface Student {
  id: number;
  fullName: string;
  username: string;
  regNumber?: string; // Registration number
}

interface Attendance {
  id?: number;
  studentId: number;
  isPresent: boolean;
  markedByTeacher: boolean;
  markedAt?: string;
}

interface UnitSession {
  id: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  startTime: string;
  endTime: string;
  location: string;
  isActive: boolean;
  date: string; // formatted date for display
}

interface RecordOfWork {
  sessionId: number;
  topic: string;
  subtopics?: string;
  description?: string;
  resources?: string;
  assignment?: string;
  notes?: string;
}

export default function MarkAttendancePage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [activeSession, setActiveSession] = useState<UnitSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, Attendance>>(new Map());
  
  const [recordOfWork, setRecordOfWork] = useState<RecordOfWork>({
    sessionId: 0,
    topic: "",
    subtopics: "",
    description: "",
    resources: "",
    assignment: "",
    notes: ""
  });
  
  const [isBulkMarkDialogOpen, setIsBulkMarkDialogOpen] = useState(false);
  const [bulkMarkStatus, setBulkMarkStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecordWorkDialogOpen, setIsRecordWorkDialogOpen] = useState(false);

  // Mock data for active session and students
  const mockSession: UnitSession = {
    id: 1,
    unitId: 1,
    unitName: "Introduction to Programming",
    unitCode: "CS101",
    startTime: "2023-05-25T10:00:00",
    endTime: "2023-05-25T12:00:00",
    location: "Room 101",
    isActive: true,
    date: "May 25, 2023"
  };

  const mockStudents: Student[] = [
    { id: 101, fullName: "Alex Johnson", username: "ajohnson", regNumber: "CS/001/2023" },
    { id: 102, fullName: "Emma Williams", username: "ewilliams", regNumber: "CS/002/2023" },
    { id: 103, fullName: "James Brown", username: "jbrown", regNumber: "CS/003/2023" },
    { id: 104, fullName: "Olivia Davis", username: "odavis", regNumber: "CS/004/2023" },
    { id: 105, fullName: "William Wilson", username: "wwilson", regNumber: "CS/005/2023" },
    { id: 106, fullName: "Sophia Martinez", username: "smartinez", regNumber: "CS/006/2023" },
    { id: 107, fullName: "Benjamin Anderson", username: "banderson", regNumber: "CS/007/2023" },
    { id: 108, fullName: "Isabella Taylor", username: "itaylor", regNumber: "CS/008/2023" },
    { id: 109, fullName: "Lucas Thomas", username: "lthomas", regNumber: "CS/009/2023" },
    { id: 110, fullName: "Mia Garcia", username: "mgarcia", regNumber: "CS/010/2023" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch("/api/user", { credentials: "include" });
        if (!userResponse.ok) {
          throw new Error("Unauthorized");
        }
        
        const userData = await userResponse.json();
        setUser(userData);
        
        // In a real app, fetch active session and enrolled students
        // const sessionId = new URLSearchParams(window.location.search).get("sessionId");
        // const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        // const session = await sessionResponse.json();
        
        // const studentsResponse = await fetch(`/api/sessions/${sessionId}/students`);
        // const students = await studentsResponse.json();
        
        // Using mock data for now
        setActiveSession(mockSession);
        setStudents(mockStudents);
        
        // Initialize attendance records map (all present by default)
        const initialAttendance = new Map<number, Attendance>();
        mockStudents.forEach(student => {
          initialAttendance.set(student.id, {
            studentId: student.id,
            isPresent: true,
            markedByTeacher: false
          });
        });
        
        setAttendanceRecords(initialAttendance);
        setRecordOfWork({
          ...recordOfWork,
          sessionId: mockSession.id
        });
        
      } catch (error) {
        console.error("Error fetching data:", error);
        if ((error as Error).message === "Unauthorized") {
          setLocation("/auth");
        } else {
          toast({
            title: "Error",
            description: "Failed to load session data. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast, setLocation]);

  const toggleAttendance = (studentId: number) => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId);
      
      if (current) {
        newMap.set(studentId, {
          ...current,
          isPresent: !current.isPresent,
          markedByTeacher: true,
          markedAt: new Date().toISOString()
        });
      }
      
      return newMap;
    });
  };

  const handleBulkMark = () => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      
      students.forEach(student => {
        newMap.set(student.id, {
          studentId: student.id,
          isPresent: bulkMarkStatus,
          markedByTeacher: true,
          markedAt: new Date().toISOString()
        });
      });
      
      return newMap;
    });
    
    setIsBulkMarkDialogOpen(false);
    
    toast({
      title: "Attendance Marked",
      description: `All students marked as ${bulkMarkStatus ? "present" : "absent"}.`,
    });
  };

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    
    try {
      // In a real app, send attendance records to server
      // const response = await fetch(`/api/sessions/${activeSession?.id}/attendance`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     attendance: Array.from(attendanceRecords.values())
      //   })
      // });
      
      // if (!response.ok) throw new Error("Failed to save attendance");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Attendance records saved successfully!",
      });
      
      // Prompt to record work
      setIsRecordWorkDialogOpen(true);
      
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRecordOfWork = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate record of work
      if (!recordOfWork.topic) {
        toast({
          title: "Missing Information",
          description: "Please enter a topic for this session.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // In a real app, send record of work to server
      // const response = await fetch(`/api/sessions/${activeSession?.id}/record-work`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(recordOfWork)
      // });
      
      // if (!response.ok) throw new Error("Failed to save record of work");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Record of work saved successfully!",
      });
      
      setIsRecordWorkDialogOpen(false);
      
      // Redirect to sessions page
      setLocation("/sessions");
      
    } catch (error) {
      console.error("Error saving record of work:", error);
      toast({
        title: "Error",
        description: "Failed to save record of work. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    let present = 0;
    let absent = 0;
    
    attendanceRecords.forEach(record => {
      if (record.isPresent) present++;
      else absent++;
    });
    
    const total = present + absent;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return {
      present,
      absent,
      total,
      presentPercentage
    };
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

  if (!activeSession) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Session</h2>
            <p className="text-muted-foreground mb-6">
              There is no active session to mark attendance for. Please start a session first.
            </p>
            <Button onClick={() => setLocation("/sessions")}>
              Go to Sessions
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = getAttendanceStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Mark Attendance</h2>
            <p className="text-muted-foreground">
              Record attendance for the current session
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkMarkStatus(true);
                setIsBulkMarkDialogOpen(true);
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkMarkStatus(false);
                setIsBulkMarkDialogOpen(true);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Mark All Absent
            </Button>
            <Button onClick={handleSaveAttendance} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Session Details
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{activeSession.unitName}</p>
              <p className="text-xs text-muted-foreground">{activeSession.unitCode}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Date & Time
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{activeSession.date}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(activeSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Location
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{activeSession.location}</p>
              <p className="text-xs text-muted-foreground">Classroom</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stats.present}/{stats.total} Present</div>
              <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.presentPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.presentPercentage}% Attendance</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>
              Mark attendance for each student in this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[100px] text-center">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const attendance = attendanceRecords.get(student.id);
                    const isPresent = attendance?.isPresent ?? false;
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.regNumber}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell className="text-center">
                          {isPresent ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Absent
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={() => toggleAttendance(student.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Total students: {students.length}
            </div>
            <Button onClick={handleSaveAttendance} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Bulk Mark Dialog */}
      <Dialog open={isBulkMarkDialogOpen} onOpenChange={setIsBulkMarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkMarkStatus ? "Mark All Students Present" : "Mark All Students Absent"}
            </DialogTitle>
            <DialogDescription>
              {bulkMarkStatus 
                ? "Are you sure you want to mark all students as present?" 
                : "Are you sure you want to mark all students as absent?"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will override any individual attendance marks you've made.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkMarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={bulkMarkStatus ? "default" : "destructive"}
              onClick={handleBulkMark}
            >
              {bulkMarkStatus 
                ? <><Check className="mr-2 h-4 w-4" /> Mark All Present</> 
                : <><X className="mr-2 h-4 w-4" /> Mark All Absent</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Record of Work Dialog */}
      <Dialog open={isRecordWorkDialogOpen} onOpenChange={setIsRecordWorkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record of Work</DialogTitle>
            <DialogDescription>
              Document what was covered in this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-right">
                  Topic <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="topic"
                  value={recordOfWork.topic}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    topic: e.target.value 
                  })}
                  placeholder="Main topic covered in this session"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtopics">
                  Subtopics
                </Label>
                <Input
                  id="subtopics"
                  value={recordOfWork.subtopics}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    subtopics: e.target.value 
                  })}
                  placeholder="Specific subtopics covered (comma separated)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={recordOfWork.description}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    description: e.target.value 
                  })}
                  placeholder="Brief description of what was covered"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resources">
                  Resources
                </Label>
                <Textarea
                  id="resources"
                  value={recordOfWork.resources}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    resources: e.target.value 
                  })}
                  placeholder="Books, websites, or other resources used"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assignment">
                  Assignment
                </Label>
                <Textarea
                  id="assignment"
                  value={recordOfWork.assignment}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    assignment: e.target.value 
                  })}
                  placeholder="Homework or assignments given"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  value={recordOfWork.notes}
                  onChange={(e) => setRecordOfWork({ 
                    ...recordOfWork, 
                    notes: e.target.value 
                  })}
                  placeholder="Any additional notes about the session"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRecordWorkDialogOpen(false)}
            >
              Save Later
            </Button>
            <Button 
              onClick={handleSaveRecordOfWork}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Save Record of Work
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}