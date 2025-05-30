import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileCheck, 
  Loader2,
  BarChart,
  GraduationCap,
  BookOpen,
  AlertCircle,
  CheckCheck
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

interface StudentAttendanceRecord {
  id: number;
  sessionId: number;
  isPresent: boolean;
  markedBySelf: boolean;
  markedByTeacher: boolean;
  markedAt: string;
  session: {
    id: number;
    unitId: number;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    isActive: boolean;
    unit: {
      id: number;
      name: string;
      code: string;
      course: {
        name: string;
        code: string;
      };
    };
  };
}

interface ActiveSession {
  id: number;
  unitId: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isActive: boolean;
  unit: {
    id: number;
    name: string;
    code: string;
    course: {
      name: string;
      code: string;
    };
  };
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [isMarkingDialogOpen, setIsMarkingDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch student's attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ["/api/attendance/student", user?.id],
    enabled: !!user?.id && user?.role === 'student',
  });

  // Fetch active sessions for the student
  const { data: activeSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/students", user?.id, "active-sessions"],
    enabled: !!user?.id && user?.role === 'student',
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ sessionId, isPresent }: { sessionId: number; isPresent: boolean }) => {
      const response = await apiRequest("POST", "/api/attendance", {
        sessionId,
        studentId: user?.id,
        isPresent,
        markedBySelf: true,
        markedByTeacher: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/student", user?.id] });
      setIsMarkingDialogOpen(false);
      setSelectedSession(null);
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const handleMarkAttendance = (session: ActiveSession) => {
    setSelectedSession(session);
    setIsMarkingDialogOpen(true);
  };

  const confirmMarkAttendance = (isPresent: boolean) => {
    if (!selectedSession) return;
    markAttendanceMutation.mutate({
      sessionId: selectedSession.id,
      isPresent,
    });
  };

  // Check if student has already marked attendance for a session
  const hasMarkedAttendance = (sessionId: number) => {
    return attendanceRecords.some((record: StudentAttendanceRecord) => 
      record.sessionId === sessionId
    );
  };

  // Get attendance record for a session
  const getAttendanceRecord = (sessionId: number) => {
    return attendanceRecords.find((record: StudentAttendanceRecord) => 
      record.sessionId === sessionId
    );
  };

  // Calculate statistics
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r: StudentAttendanceRecord) => r.isPresent).length;
  const absentCount = totalRecords - presentCount;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Filter today's sessions
  const todaysSessions = activeSessions.filter((session: ActiveSession) => 
    isToday(parseISO(session.date))
  );

  // Filter upcoming sessions (next 7 days)
  const upcomingSessions = activeSessions.filter((session: ActiveSession) => {
    const sessionDate = parseISO(session.date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return sessionDate > today && sessionDate <= nextWeek;
  });

  if (isLoadingRecords || isLoadingSessions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading attendance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground">
            Track your class attendance and mark yourself present for active sessions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords}</div>
              <p className="text-xs text-muted-foreground">All recorded sessions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <p className="text-xs text-muted-foreground">Classes attended</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <p className="text-xs text-muted-foreground">Classes missed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    attendanceRate >= 80 ? 'bg-green-500' : 
                    attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Sessions */}
        {todaysSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Today's Sessions
              </CardTitle>
              <CardDescription>
                Sessions you can mark attendance for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysSessions.map((session: ActiveSession) => {
                  const hasMarked = hasMarkedAttendance(session.id);
                  const attendanceRecord = getAttendanceRecord(session.id);
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{session.unit.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.unit.course.name} ({session.unit.course.code})
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.startTime} - {session.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasMarked ? (
                          <div className="flex items-center gap-2">
                            {attendanceRecord?.isPresent ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Present
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Marked {attendanceRecord?.markedBySelf ? 'by you' : 'by teacher'}
                            </span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleMarkAttendance(session)}
                            disabled={!session.isActive}
                            size="sm"
                          >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>
                Your scheduled sessions for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session: ActiveSession) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-orange-500" />
                      <div>
                        <h4 className="font-medium text-sm">{session.unit.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(session.date), 'EEE, MMM d')} • {session.startTime} - {session.endTime}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.location}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance History</CardTitle>
            <CardDescription>
              Your attendance records for the last 10 sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records yet.</p>
                <p className="text-sm">Your attendance will appear here once you start attending sessions.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.slice(0, 10).map((record: StudentAttendanceRecord) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.session.unit.name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.session.unit.course.name}</div>
                          <div className="text-sm text-muted-foreground">{record.session.unit.course.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(record.session.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {record.session.startTime} - {record.session.endTime}
                      </TableCell>
                      <TableCell>
                        {record.isPresent ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Absent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          {record.markedBySelf ? 'Self' : 'Teacher'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Mark Attendance Dialog */}
        <Dialog open={isMarkingDialogOpen} onOpenChange={setIsMarkingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Mark your attendance for this session
              </DialogDescription>
            </DialogHeader>
            
            {selectedSession && (
              <div className="py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{selectedSession.unit.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedSession.unit.course.name} ({selectedSession.unit.course.code})
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(selectedSession.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedSession.startTime} - {selectedSession.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedSession.location}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMarkingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmMarkAttendance(false)}
                disabled={markAttendanceMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark Absent
              </Button>
              <Button
                onClick={() => confirmMarkAttendance(true)}
                disabled={markAttendanceMutation.isPending}
              >
                {markAttendanceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark Present
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}