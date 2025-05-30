import React, { createContext, useState, ReactNode } from 'react';
import { UnitSession, Unit, Course, Level } from "@shared/schema";
import { AttendanceModal } from "@/components/attendance/attendance-modal";
import { RecordWorkModal } from "@/components/attendance/record-work-modal";

interface ModalContextType {
  openAttendanceModal: (
    session: UnitSession,
    unit: Unit,
    course: Course,
    level: Level
  ) => void;
  openRecordWorkModal: (
    session: UnitSession,
    unit: Unit,
    course: Course,
    level: Level
  ) => void;
}

export const ModalContext = createContext<ModalContextType>({
  openAttendanceModal: () => {},
  openRecordWorkModal: () => {},
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [recordWorkModalOpen, setRecordWorkModalOpen] = useState(false);
  
  const [selectedSession, setSelectedSession] = useState<UnitSession | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  
  const openAttendanceModal = (
    session: UnitSession,
    unit: Unit,
    course: Course,
    level: Level
  ) => {
    setSelectedSession(session);
    setSelectedUnit(unit);
    setSelectedCourse(course);
    setSelectedLevel(level);
    setAttendanceModalOpen(true);
  };
  
  const openRecordWorkModal = (
    session: UnitSession,
    unit: Unit,
    course: Course,
    level: Level
  ) => {
    setSelectedSession(session);
    setSelectedUnit(unit);
    setSelectedCourse(course);
    setSelectedLevel(level);
    setRecordWorkModalOpen(true);
  };
  
  return (
    <ModalContext.Provider value={{ openAttendanceModal, openRecordWorkModal }}>
      {children}
      
      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        session={selectedSession}
        unit={selectedUnit}
        course={selectedCourse}
        level={selectedLevel}
      />
      
      <RecordWorkModal
        isOpen={recordWorkModalOpen}
        onClose={() => setRecordWorkModalOpen(false)}
        session={selectedSession}
        unit={selectedUnit}
        course={selectedCourse}
        level={selectedLevel}
      />
    </ModalContext.Provider>
  );
}
