import { Unit, Course, Level } from "@shared/schema";
import { Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnitCardProps {
  unit: Unit;
  course: Course;
  level: Level;
  students: number;
  schedule: string;
  attendanceRate: number;
  onDetails: () => void;
}

export function UnitCard({ 
  unit, 
  course, 
  level, 
  students, 
  schedule, 
  attendanceRate,
  onDetails 
}: UnitCardProps) {
  // Determine color based on attendance rate
  const getAttendanceColor = (rate: number) => {
    if (rate >= 85) return "bg-green-500";
    if (rate >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4">
        <h3 className="font-medium">{unit.name}</h3>
        <p className="text-sm text-slate-500 mt-1">{course.name} - {level.name}</p>
        
        <div className="mt-3 flex items-center text-sm text-slate-600">
          <Users className="text-slate-400 mr-1" size={16} />
          {students} Students
        </div>
        
        <div className="mt-2 flex items-center text-sm text-slate-600">
          <Calendar className="text-slate-400 mr-1" size={16} />
          {schedule}
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Attendance Rate</p>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className={`${getAttendanceColor(attendanceRate)} h-full rounded-full`} style={{ width: `${attendanceRate}%` }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">{attendanceRate}%</span>
              </div>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary-800 hover:text-primary-900"
              onClick={onDetails}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
