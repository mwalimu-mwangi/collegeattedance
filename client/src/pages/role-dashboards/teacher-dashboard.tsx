import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { Calendar, Clock, BookOpen, BarChart3, User, Loader2, School } from "lucide-react";
import { format } from "date-fns";
import { Unit, Course } from "@shared/schema";

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

export default function TeacherDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch real data for teacher's assigned units
  const { data: allUnits = [], isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });
  
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Filter units assigned to this teacher
  const teacherUnits = allUnits.filter(unit => unit.teacherId === user?.id);
  
  // Get course names for the units
  const unitsWithCourseNames = teacherUnits.map(unit => {
    const course = courses.find(c => c.id === unit.courseId);
    return {
      ...unit,
      courseName: course?.name || 'Unknown Course'
    };
  });

  // Mock data for teacher's sessions
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
      unitId: 1,
      unitName: "Introduction to Programming",
      unitCode: "CS101",
      date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // Day after tomorrow
      startTime: "10:00:00",
      endTime: "12:00:00",
      location: "Room 101",
      weekNumber: 5
    }
  ];

  // Mock attendance stats
  const mockAttendanceStats = {
    totalSessions: 25,
    completedSessions: 18,
    averageAttendance: 87.5,
    totalStudents: 45
  };

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        // Reset to empty data while we implement the real API endpoints
        setMyUnits([]);
        setTodaySessions([]);
        setUpcomingSessions([]);
        setAttendanceStats({
          totalSessions: 0,
          completedSessions: 0,
          averageAttendance: 0,
          totalStudents: 0
        });
        
      } catch (error) {
        console.error("Error loading teacher data:", error);
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
      loadTeacherData();
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
            Here's an overview of your teaching schedule and responsibilities
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
                  <p className="text-sm text-muted-foreground">My Units</p>
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
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <h4 className="text-2xl font-bold">{attendanceStats.completedSessions}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <h4 className="text-2xl font-bold">{attendanceStats.totalStudents}</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
            <CardDescription>
              Your teaching schedule for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No sessions today</h3>
                <p className="text-muted-foreground">Enjoy your day off!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.unitName}</div>
                          <div className="text-sm text-muted-foreground">{session.unitCode}</div>
                        </TableCell>
                        <TableCell>{formatTime(session.startTime)} - {formatTime(session.endTime)}</TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button asChild size="sm">
                              <Link href={`/mark-attendance?sessionId=${session.id}`}>
                                Mark Attendance
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/record-work?sessionId=${session.id}`}>
                                Record Work
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your teaching schedule for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No upcoming sessions</h3>
                <p className="text-muted-foreground">Your schedule is clear for the next week</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.unitName}</div>
                          <div className="text-sm text-muted-foreground">{session.unitCode}</div>
                        </TableCell>
                        <TableCell>{formatDate(session.date)}</TableCell>
                        <TableCell>{formatTime(session.startTime)} - {formatTime(session.endTime)}</TableCell>
                        <TableCell>{session.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sessions">
                View All Sessions
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* My Units */}
        <Card>
          <CardHeader>
            <CardTitle>My Units</CardTitle>
            <CardDescription>
              Units you are teaching this term
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myUnits.map((unit) => (
                <Card key={unit.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{unit.name}</CardTitle>
                    <CardDescription>{unit.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm flex items-center">
                      <School className="mr-2 h-4 w-4 text-muted-foreground" />
                      {unit.courseName}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/unit-details/${unit.id}`}>
                        View Unit
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/units">
                View All Units
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}