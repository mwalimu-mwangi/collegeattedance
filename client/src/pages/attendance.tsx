import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileCheck, 
  Loader2,
  BarChart
} from "lucide-react";
import { format } from "date-fns";
import { type Attendance, type UnitSession, type Unit } from "@shared/schema";

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<UnitSession | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch attendance records for the current user if they're a student
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: ['/api/students', user?.id, 'attendance'],
    enabled: !!user && user.role === 'student'
  });

  // Fetch active sessions for all users (students need to see them to mark attendance)
  const { data: activeSessions = [], isLoading: isLoadingActiveSessions } = useQuery<UnitSession[]>({
    queryKey: user?.role === 'student' 
      ? [`/api/students/${user?.id}/active-sessions`]
      : [`/api/teacher/${user?.id}/active-sessions`],
    enabled: !!user
  });

  // Fetch all units for context
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['/api/units'],
    enabled: !!user
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ sessionId, isPresent }: { sessionId: number; isPresent: boolean }) => {
      const response = await apiRequest("POST", "/api/attendance", {
        sessionId,
        studentId: user?.id,
        isPresent,
        markedBySelf: true,
        markedByTeacher: false
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance marked",
        description: "Your attendance has been recorded successfully"
      });
      setConfirmDialogOpen(false);
      setSelectedSession(null);
      queryClient.invalidateQueries({ queryKey: ['/api/students', user?.id, 'attendance'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleMarkAttendance = (session: UnitSession) => {
    setSelectedSession(session);
    setConfirmDialogOpen(true);
  };

  const confirmAttendance = () => {
    if (!selectedSession) return;
    
    markAttendanceMutation.mutate({
      sessionId: selectedSession.id,
      isPresent: true
    });
  };

  // Calculate statistics for students
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.isPresent).length;
  const absentCount = totalRecords - presentCount;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  if (isLoadingAttendance || isLoadingActiveSessions) {
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            {user?.role === 'student' ? 'View your attendance records and mark attendance for active sessions' : 'Manage attendance for your classes'}
          </p>
        </div>

        {/* Statistics Cards for Students */}
        {user?.role === 'student' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-xs text-muted-foreground">All attendance entries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{presentCount}</div>
                <p className="text-xs text-muted-foreground">Classes attended</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{absentCount}</div>
                <p className="text-xs text-muted-foreground">Classes missed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <BarChart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Sessions where attendance can be marked now
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {activeSessions.map((session) => {
                  const unit = units.find(u => u.id === session.unitId);
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col rounded-lg border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-medium">
                          {unit?.name || 'Unknown Unit'} ({unit?.code || 'N/A'})
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(session.date, 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(session.startTime, 'HH:mm')} - {format(session.endTime, 'HH:mm')}
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>
                      {user?.role === 'student' && (
                        <Button
                          onClick={() => handleMarkAttendance(session)}
                          className="mt-4 sm:mt-0"
                          disabled={markAttendanceMutation.isPending}
                        >
                          {markAttendanceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Mark Present'
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records Table for Students */}
        {user?.role === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Attendance History</CardTitle>
              <CardDescription>Complete record of your class attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No attendance records yet</p>
                  <p className="text-muted-foreground">Your attendance history will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const unit = units.find(u => u.id === record.sessionId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{unit?.name || 'Unknown Unit'}</div>
                              <div className="text-sm text-muted-foreground">{unit?.code || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(record.markedAt, 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.isPresent ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-green-700">Present</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-700">Absent</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.markedBySelf ? 'Self-marked' : 'Teacher-marked'}
                              <div className="text-xs text-muted-foreground">
                                {format(record.markedAt, 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Message for teachers */}
        {(user?.role === 'teacher' || user?.role === 'hod') && activeSessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Active Sessions</p>
              <p className="text-muted-foreground">You don't have any active sessions right now</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark yourself as present for this session?
              {selectedSession && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="font-medium">
                    {units.find(u => u.id === selectedSession.unitId)?.name || 'Unknown Unit'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(selectedSession.date, 'MMM dd, yyyy')} • {format(selectedSession.startTime, 'HH:mm')} - {format(selectedSession.endTime, 'HH:mm')}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAttendance}
              disabled={markAttendanceMutation.isPending}
            >
              {markAttendanceMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Mark Present
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}