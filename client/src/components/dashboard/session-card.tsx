import { UnitSession, Unit, Course, Level } from "@shared/schema";
import { format } from "date-fns";
import { Clock, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { ModalContext } from "@/context/modal-context";

interface SessionCardProps {
  session: UnitSession;
  unit: Unit;
  course: Course;
  level: Level;
  status: "active" | "upcoming";
  attendance?: {
    present: number;
    total: number;
  };
}

export function SessionCard({ session, unit, course, level, status, attendance }: SessionCardProps) {
  const { openAttendanceModal, openRecordWorkModal } = useContext(ModalContext);
  
  const isActive = status === "active";
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  
  // Calculate time remaining or time until session starts
  const now = new Date();
  const timeUntilStart = startTime.getTime() - now.getTime();
  const timeRemaining = endTime.getTime() - now.getTime();
  
  // Format for display
  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  const handleAttendance = () => {
    openAttendanceModal(session, unit, course, level);
  };
  
  const handleRecordWork = () => {
    openRecordWorkModal(session, unit, course, level);
  };

  return (
    <div className={`p-4 border-b border-slate-200 ${isActive ? "bg-green-50" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-slate-400"} mr-2`}></span>
            <h3 className="font-medium">{unit.name}</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">{course.name} - {level.name}</p>
          <div className="flex items-center mt-2 text-sm text-slate-600">
            <Clock className="text-slate-400 mr-1" size={16} />
            {format(startTime, "hh:mm a")} - {format(endTime, "hh:mm a")}
            <span className="mx-2 text-slate-300">|</span>
            <MapPin className="text-slate-400 mr-1" size={16} />
            {session.location || "TBD"}
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant={isActive ? "default" : "secondary"}
            size="sm"
            className={isActive ? "bg-primary-800 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}
            disabled={!isActive}
            onClick={handleAttendance}
          >
            <Check className="mr-1" size={16} />
            Take Attendance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={isActive ? "" : "text-slate-400 cursor-not-allowed"}
            disabled={!isActive}
            onClick={handleRecordWork}
          >
            <span className="mr-1">📝</span>
            Record Work
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm">
        {isActive ? (
          <div className="text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded text-xs">
            <Check className="inline-block mr-1" size={12} />
            In Progress {attendance && `(${attendance.present}/${attendance.total} students present)`}
          </div>
        ) : (
          <div className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">
            Upcoming (Starts in {formatTimeRemaining(timeUntilStart)})
          </div>
        )}
      </div>
    </div>
  );
}
