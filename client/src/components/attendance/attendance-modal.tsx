import { useState, useEffect } from "react";
import { UnitSession, Unit, Course, Level, User } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Clock, MapPin, Search, Edit, Check, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UnitSession | null;
  unit: Unit | null;
  course: Course | null;
  level: Level | null;
}

interface StudentAttendance {
  id: number;
  studentId: number;
  sessionId: number;
  isPresent: boolean;
  markedBySelf: boolean;
  markedByTeacher: boolean;
  markedAt: Date;
  student: {
    id: number;
    fullName: string;
    email: string;
    studentId: string;
  };
}

export function AttendanceModal({ isOpen, onClose, session, unit, course, level }: AttendanceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendance[]>([]);
  
  // Fetch students enrolled in the course
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/courses", course?.id, "students"],
    queryFn: async () => {
      if (!course?.id) return [];
      const res = await fetch(`/api/courses/${course.id}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!course?.id && isOpen
  });
  
  // Fetch attendance records for this session
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/sessions", session?.id, "attendance"],
    queryFn: async () => {
      if (!session?.id) return [];
      const res = await fetch(`/api/sessions/${session.id}/attendance`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!session?.id && isOpen
  });
  
  // Save attendance records
  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      const res = await apiRequest("POST", "/api/attendance", attendanceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "attendance"] });
      toast({
        title: "Attendance saved",
        description: "The attendance records have been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save attendance",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update attendance record
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/attendance/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "attendance"] });
      toast({
        title: "Attendance updated",
        description: "The attendance record has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update attendance",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Prepare attendance records combining student data with attendance data
  useEffect(() => {
    if (!students || !attendance) return;
    
    const records = students.map((student: any) => {
      const attendanceRecord = attendance.find((a: any) => a.studentId === student.id);
      
      if (attendanceRecord) {
        return {
          ...attendanceRecord,
          student: {
            id: student.id,
            fullName: student.fullName,
            email: student.email,
            studentId: student.studentId || `STU/${student.id}`
          }
        };
      } else {
        return {
          id: 0, // Will be assigned when saved
          studentId: student.id,
          sessionId: session?.id,
          isPresent: false,
          markedBySelf: false,
          markedByTeacher: false,
          markedAt: new Date(),
          student: {
            id: student.id,
            fullName: student.fullName,
            email: student.email,
            studentId: student.studentId || `STU/${student.id}`
          }
        };
      }
    });
    
    setAttendanceRecords(records);
  }, [students, attendance, session]);
  
  const filteredRecords = attendanceRecords.filter(record => 
    record.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleMarkAttendance = (studentId: number, isPresent: boolean) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.student.id === studentId
          ? { 
              ...record, 
              isPresent,
              markedByTeacher: true,
              markedAt: new Date() 
            }
          : record
      )
    );
    
    // If the record already exists, update it
    const record = attendanceRecords.find(r => r.student.id === studentId);
    if (record && record.id) {
      updateAttendanceMutation.mutate({
        id: record.id,
        updates: {
          isPresent,
          markedByTeacher: true,
          markedAt: new Date()
        }
      });
    }
  };
  
  const handleMarkAllPresent = () => {
    setAttendanceRecords(prev => 
      prev.map(record => ({
        ...record,
        isPresent: true,
        markedByTeacher: true,
        markedAt: new Date()
      }))
    );
  };
  
  const handleMarkAllAbsent = () => {
    setAttendanceRecords(prev => 
      prev.map(record => ({
        ...record,
        isPresent: false,
        markedByTeacher: true,
        markedAt: new Date()
      }))
    );
  };
  
  const handleSaveAttendance = () => {
    // Only save records that don't have an ID yet
    const newRecords = attendanceRecords.filter(record => !record.id);
    
    if (newRecords.length > 0) {
      // Save new records
      newRecords.forEach(record => {
        const { student, ...attendanceData } = record;
        saveAttendanceMutation.mutate(attendanceData);
      });
    }
    
    onClose();
  };
  
  if (!isOpen || !session || !unit || !course || !level) return null;
  
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  
  // Calculate present students count
  const presentCount = attendanceRecords.filter(record => record.isPresent).length;
  const totalCount = attendanceRecords.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-medium text-lg">Take Attendance - {unit.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{course.name} - {level.name}</p>
              <div className="flex items-center mt-1 text-sm text-slate-600">
                <Clock className="text-slate-400 mr-1" size={16} />
                {format(startTime, "PP")} ({format(startTime, "hh:mm a")} - {format(endTime, "hh:mm a")})
                <span className="mx-2 text-slate-300">|</span>
                <MapPin className="text-slate-400 mr-1" size={16} />
                {session.location || "TBD"}
              </div>
            </div>
            
            <div className="flex items-center">
              {session.isActive && (
                <div className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                  <Clock className="mr-1" size={16} />
                  Session Active
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="text-slate-400" size={16} />
              </div>
              <Input
                type="text"
                className="pl-10"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                disabled={studentsLoading || attendanceLoading}
              >
                <Check className="mr-1" size={16} />
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAbsent}
                disabled={studentsLoading || attendanceLoading}
              >
                <X className="mr-1" size={16} />
                Mark All Absent
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Self-Attendance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {studentsLoading || attendanceLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                      Loading students and attendance data...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {record.student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
                            <span className="text-xs">{record.student.fullName.charAt(0)}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{record.student.fullName}</div>
                            <div className="text-xs text-slate-500">{record.student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.isPresent 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {record.isPresent ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.markedBySelf ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="mr-1" size={16} />
                            Marked
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-500">
                            <XCircle className="mr-1" size={16} />
                            Not Marked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {record.markedAt ? format(new Date(record.markedAt), "hh:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex space-x-2">
                          {record.isPresent ? (
                            <button 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleMarkAttendance(record.student.id, false)}
                            >
                              <X size={16} />
                            </button>
                          ) : (
                            <button 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleMarkAttendance(record.student.id, true)}
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button className="text-amber-600 hover:text-amber-700">
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-between">
          <div className="text-sm text-slate-500">
            <span className="font-medium">{presentCount}</span> of <span className="font-medium">{totalCount}</span> students present ({attendancePercentage}%)
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="bg-primary-800 hover:bg-primary-900" 
              onClick={handleSaveAttendance}
              disabled={saveAttendanceMutation.isPending}
            >
              Save Attendance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
