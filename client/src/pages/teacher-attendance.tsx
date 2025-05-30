import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Eye,
  Loader2
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Unit {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  courseId: number;
  course?: {
    name: string;
    level?: {
      name: string;
    };
  };
}

interface UnitSession {
  id: number;
  unitId: number;
  startTime: string;
  endTime: string;
  date: string;
  dayOfWeek: string;
  location: string;
  isActive: boolean;
  attendanceCount?: {
    present: number;
    total: number;
  };
}

interface Student {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  class?: {
    id: number;
    name: string;
  };
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  sessionId: number;
  isPresent: boolean;
  markedAt: string;
  student?: Student;
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  // Fetch teacher's units
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ["/api/units"],
    enabled: !!user?.id,
  });

  // Filter units for the current teacher
  const teacherUnits = units.filter((unit: Unit) => 
    user?.role === 'teacher' ? unit.teacherId === user.id : true
  );

  // Fetch sessions for selected unit
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/units", selectedUnitId, "sessions"],
    queryFn: async () => {
      if (!selectedUnitId) return [];
      console.log("Fetching sessions for unit:", selectedUnitId);
      const response = await fetch(`/api/units/${selectedUnitId}/sessions`);
      if (!response.ok) {
        console.error("Failed to fetch sessions:", response.status, response.statusText);
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      console.log("Sessions fetched for unit", selectedUnitId, ":", data);
      return data;
    },
    enabled: !!selectedUnitId,
  });

  // Fetch students for selected session
  const { data: sessionStudents = [], isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ["/api/sessions", selectedSessionId, "students"],
    enabled: !!selectedSessionId,
  });

  // Fetch attendance records for selected session
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/sessions", selectedSessionId, "attendance"],
    enabled: !!selectedSessionId,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { sessionId: number; studentId: number; isPresent: boolean }) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", selectedSessionId, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "sessions"] });
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: { sessionId: number; attendance: { studentId: number; isPresent: boolean }[] }) => {
      const response = await apiRequest("POST", "/api/attendance/bulk", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", selectedSessionId, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "sessions"] });
      refetchStudents(); // Refresh student list
      toast({
        title: "Success",
        description: `Attendance saved for ${data.records?.length || 0} students`,
      });
      setIsAttendanceDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bulk attendance",
        variant: "destructive",
      });
    },
  });

  const selectedUnit = teacherUnits.find((unit: Unit) => unit.id === selectedUnitId);
  const selectedSession = sessions.find((session: UnitSession) => session.id === selectedSessionId);

  // Filter students based on search and status
  const filteredStudents = sessionStudents.filter((student: Student) => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    
    const attendance = attendanceRecords.find((record: AttendanceRecord) => 
      record.studentId === student.id
    );
    
    if (statusFilter === "present") return matchesSearch && attendance?.isPresent;
    if (statusFilter === "absent") return matchesSearch && (!attendance || !attendance.isPresent);
    
    return matchesSearch;
  });

  const handleMarkAttendance = (studentId: number, isPresent: boolean) => {
    if (!selectedSessionId) return;
    
    markAttendanceMutation.mutate({
      sessionId: selectedSessionId,
      studentId,
      isPresent,
    });
  };

  const handleBulkAttendance = (attendanceData: { studentId: number; isPresent: boolean }[]) => {
    if (!selectedSessionId) return;
    
    bulkAttendanceMutation.mutate({
      sessionId: selectedSessionId,
      attendance: attendanceData,
    });
  };

  if (unitsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Teacher Attendance Management</h1>
          <p className="text-muted-foreground">
            Manage attendance for your assigned units and sessions
          </p>
        </div>

        {/* Unit Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Unit</CardTitle>
            <CardDescription>
              Choose a unit to manage attendance for its sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherUnits.map((unit: Unit) => (
                <button
                  key={unit.id}
                  onClick={() => {
                    console.log("Selecting unit:", unit.id, unit.name);
                    setSelectedUnitId(unit.id);
                    setSelectedSessionId(null);
                  }}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selectedUnitId === unit.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{unit.name}</div>
                  <div className="text-sm text-muted-foreground">{unit.code}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Course: {unit.course?.name || 'Unknown Course'}
                  </div>
                </button>
              ))}
            </div>
            
            {teacherUnits.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No units assigned</p>
                <p className="text-muted-foreground">Contact your administrator to get units assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions */}
        {selectedUnitId && (
          <Card>
            <CardHeader>
              <CardTitle>Sessions for {selectedUnit?.name}</CardTitle>
              <CardDescription>
                Select a session to manage attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No sessions scheduled</p>
                  <p className="text-muted-foreground">Sessions will appear here once created</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session: UnitSession, index) => (
                    <button
                      key={`session-${session.id}-${index}`}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`text-left p-4 rounded-lg border transition-colors ${
                        selectedSessionId === session.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {session.date ? format(parseISO(session.date), 'MMM dd, yyyy') : 'No Date Set'}
                          </span>
                        </div>
                        <Badge variant={session.isActive ? "default" : "secondary"}>
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 mt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {session.attendanceCount 
                            ? `${session.attendanceCount.present}/${session.attendanceCount.total} attended`
                            : "No attendance data"
                          }
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Management */}
        {selectedSessionId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Attendance Management</CardTitle>
                  <CardDescription>
                    Mark attendance for {selectedSession && selectedSession.date ? format(parseISO(selectedSession.date), 'MMM dd, yyyy') : 'selected'} session
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Quick View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Quick Attendance Entry</DialogTitle>
                      </DialogHeader>
                      <QuickAttendanceDialog
                        students={sessionStudents}
                        attendanceRecords={attendanceRecords}
                        onSave={handleBulkAttendance}
                        isLoading={bulkAttendanceMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attendance Table */}
              {studentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search criteria" : "No students are enrolled in this session"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Marked At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student: Student) => {
                          const attendance = attendanceRecords.find((record: AttendanceRecord) => 
                            record.studentId === student.id
                          );
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{student.fullName}</div>
                                  <div className="text-sm text-muted-foreground">{student.username}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {student.class?.name || 'No Class'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {attendance ? (
                                  <Badge variant={attendance.isPresent ? "default" : "destructive"}>
                                    {attendance.isPresent ? "Present" : "Absent"}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Marked</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {attendance ? (
                                  <span className="text-sm">
                                    {format(new Date(attendance.markedAt), 'HH:mm')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant={attendance?.isPresent ? "default" : "outline"}
                                    onClick={() => handleMarkAttendance(student.id, true)}
                                    disabled={markAttendanceMutation.isPending}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={attendance?.isPresent === false ? "destructive" : "outline"}
                                    onClick={() => handleMarkAttendance(student.id, false)}
                                    disabled={markAttendanceMutation.isPending}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {filteredStudents.map((student: Student) => {
                      const attendance = attendanceRecords.find((record: AttendanceRecord) => 
                        record.studentId === student.id
                      );
                      
                      return (
                        <Card key={student.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{student.fullName}</div>
                                <div className="text-sm text-muted-foreground">{student.username}</div>
                              </div>
                              <Badge variant="outline">
                                {student.class?.name || 'No Class'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                {attendance ? (
                                  <Badge variant={attendance.isPresent ? "default" : "destructive"}>
                                    {attendance.isPresent ? "Present" : "Absent"}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not Marked</Badge>
                                )}
                                {attendance && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Marked at {format(new Date(attendance.markedAt), 'HH:mm')}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant={attendance?.isPresent ? "default" : "outline"}
                                  onClick={() => handleMarkAttendance(student.id, true)}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendance?.isPresent === false ? "destructive" : "outline"}
                                  onClick={() => handleMarkAttendance(student.id, false)}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Quick Attendance Dialog Component
interface QuickAttendanceDialogProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSave: (attendance: { studentId: number; isPresent: boolean }[]) => void;
  isLoading: boolean;
}

function QuickAttendanceDialog({ students, attendanceRecords, onSave, isLoading }: QuickAttendanceDialogProps) {
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    attendanceRecords.forEach(record => {
      initial[record.studentId] = record.isPresent;
    });
    return initial;
  });

  const handleSubmit = () => {
    const attendanceData = students.map(student => ({
      studentId: student.id,
      isPresent: attendanceState[student.id] ?? false,
    }));
    onSave(attendanceData);
  };

  const markAllPresent = () => {
    const newState: Record<number, boolean> = {};
    students.forEach(student => {
      newState[student.id] = true;
    });
    setAttendanceState(newState);
  };

  const markAllAbsent = () => {
    const newState: Record<number, boolean> = {};
    students.forEach(student => {
      newState[student.id] = false;
    });
    setAttendanceState(newState);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={markAllPresent} size="sm">
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark All Present
        </Button>
        <Button variant="outline" onClick={markAllAbsent} size="sm">
          <XCircle className="h-4 w-4 mr-1" />
          Mark All Absent
        </Button>
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-2">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{student.fullName}</div>
              <div className="text-sm text-muted-foreground">{student.username}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={attendanceState[student.id] ?? false}
                onCheckedChange={(checked) => {
                  setAttendanceState(prev => ({
                    ...prev,
                    [student.id]: checked as boolean,
                  }));
                }}
              />
              <span className="text-sm">
                {attendanceState[student.id] ? "Present" : "Absent"}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          Save Attendance
        </Button>
      </div>
    </div>
  );
}