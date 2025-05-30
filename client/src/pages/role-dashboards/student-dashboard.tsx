import { useState, useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BarChart3,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface Unit {
  id: number;
  name: string;
  code: string;
  courseId: number;
  courseName?: string;
  teacherId: number;
  teacherName?: string;
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
  unitId: number;
  unitName?: string;
  unitCode?: string;
  date: string;
  status: "present" | "absent" | "excused";
}

export default function StudentDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [myUnits, setMyUnits] = useState<Unit[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UnitSession[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    attendanceRate: 0,
    excusedSessions: 0,
  });

  // Mock data for student's units
  const mockUnits: Unit[] = [
    { id: 1, name: "Introduction to Programming", code: "CS101", courseId: 1, courseName: "Bachelor of Computer Science", teacherId: 1, teacherName: "John Smith" },
    { id: 2, name: "Data Structures", code: "CS201", courseId: 1, courseName: "Bachelor of Computer Science", teacherId: 2, teacherName: "Sarah Johnson" },
    { id: 3, name: "Web Development", code: "CS204", courseId: 1, courseName: "Bachelor of Computer Science", teacherId: 3, teacherName: "Michael Brown" },
    { id: 4, name: "Database Systems", code: "CS301", courseId: 1, courseName: "Bachelor of Computer Science", teacherId: 1, teacherName: "John Smith" },
  ];

  // Mock data for student's upcoming sessions
  const mockSessions: UnitSession[] = [
    {
      id: 1,
      unitId: 1,
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: new Date().toISOString(), // Today
      startTime: "10:00:00",
      endTime: "12:00:00",
      location: "Room 101",
      weekNumber: 5
    },
    {
      id: 2,
      unitId: 2,
      unitName: "Data Structures",
      unitCode: "CS201",
      date: new Date().toISOString(), // Today
      startTime: "14:00:00",
      endTime: "16:00:00",
      location: "Lab 3",
      weekNumber: 5
    },
    {
      id: 3,
      unitId: 3,
      unitName: "Web Development",
      unitCode: "CS204",
      date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Tomorrow
      startTime: "09:00:00",
      endTime: "11:00:00",
      location: "Room 201",
      weekNumber: 5
    },
    {
      id: 4,
      unitId: 4,
      unitName: "Database Systems",
      unitCode: "CS301",
      date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // Day after tomorrow
      startTime: "11:00:00",
      endTime: "13:00:00",
      location: "Room 105",
      weekNumber: 5
    }
  ];

  // Mock data for student's recent attendance
  const mockAttendance: AttendanceRecord[] = [
    {
      id: 1,
      sessionId: 101,
      unitId: 1,
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
      status: "present"
    },
    {
      id: 2,
      sessionId: 102,
      unitId: 2,
      unitName: "Data Structures",
      unitCode: "CS201",
      date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
      status: "present"
    },
    {
      id: 3,
      sessionId: 103,
      unitId: 3,
      unitName: "Web Development",
      unitCode: "CS204",
      date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 days ago
      status: "absent"
    },
    {
      id: 4,
      sessionId: 104,
      unitId: 4,
      unitName: "Database Systems",
      unitCode: "CS301",
      date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), // 3 days ago
      status: "excused"
    },
    {
      id: 5,
      sessionId: 105,
      unitId: 1,
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), // 3 days ago
      status: "present"
    }
  ];

  // Mock attendance stats
  const mockAttendanceStats = {
    totalSessions: 35,
    attendedSessions: 28,
    attendanceRate: 80,
    excusedSessions: 3
  };

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        // Reset to empty data while we implement the real API endpoints
        setMyUnits([]);
        setUpcomingSessions([]);
        setRecentAttendance([]);
        setAttendanceStats({
          totalSessions: 0,
          attendedSessions: 0,
          attendanceRate: 0,
          excusedSessions: 0
        });
        
      } catch (error) {
        console.error("Error loading student data:", error);
        toast({
          title: "Error",
          description: "Failed to load your dashboard data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadStudentData();
    }
  }, [user, toast]);

  const formatTime = (timeString: string) => {
    try {
      // Assuming timeString is in format "HH:MM:SS"
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return format(date, "h:mm a"); // "9:30 AM" format
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "PPP"); // "Apr 29, 2023" format
    } catch (error) {
      return dateString;
    }
  };

  const getStatusElement = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Absent
          </span>
        );
      case "excused":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Excused
          </span>
        );
      default:
        return null;
    }
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
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Welcome, {user?.fullName}</h2>
          <p className="text-muted-foreground">
            Here's an overview of your academic progress and schedule
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Units</p>
                  <h4 className="text-2xl font-bold">{myUnits.length}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <h4 className="text-2xl font-bold">{attendanceStats.totalSessions}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 rounded-full p-3">
                  <CheckCircle2 className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attended</p>
                  <h4 className="text-2xl font-bold">{attendanceStats.attendedSessions}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <h4 className="text-2xl font-bold">{attendanceStats.attendanceRate}%</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your class schedule for the next few days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No upcoming sessions</h3>
                <p className="text-muted-foreground">You don't have any upcoming classes scheduled</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSessions.map((session) => {
                      const unit = myUnits.find(u => u.id === session.unitId);
                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="font-medium">{session.unitName}</div>
                            <div className="text-sm text-muted-foreground">{session.unitCode}</div>
                          </TableCell>
                          <TableCell>{formatDate(session.date)}</TableCell>
                          <TableCell>{formatTime(session.startTime)} - {formatTime(session.endTime)}</TableCell>
                          <TableCell>{session.location}</TableCell>
                          <TableCell>{unit?.teacherName || "Unknown"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/student/schedule">
                View Full Schedule
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>
              Your attendance records from recent sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No recent attendance</h3>
                <p className="text-muted-foreground">You don't have any recent attendance records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.unitName}</div>
                          <div className="text-sm text-muted-foreground">{record.unitCode}</div>
                        </TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{getStatusElement(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/student/attendance">
                View All Attendance Records
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* My Units */}
        <Card>
          <CardHeader>
            <CardTitle>My Units</CardTitle>
            <CardDescription>
              Units you are currently enrolled in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Code</TableHead>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.code}</TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.teacherName}</TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Link href={`/student/units/${unit.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}