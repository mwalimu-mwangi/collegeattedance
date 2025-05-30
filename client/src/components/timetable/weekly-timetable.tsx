import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, GripVertical, Trash } from "lucide-react";

// Time slots from 8 AM to 8 PM
const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return {
    id: `${hour}:00`,
    displayTime: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
    hour,
  };
});

// Days of the week
const daysOfWeek = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 0, name: "Sunday" },
];

// Interface for unit schedule item
interface UnitScheduleItem {
  id: string | number;
  unitId: number;
  unitName: string;
  unitCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  durationHours: number;
}

interface UnitOption {
  id: number;
  name: string;
  code: string;
}

interface WeeklyTimetableProps {
  units: UnitOption[];
  initialSchedules?: UnitScheduleItem[];
  onSchedulesChange?: (schedules: UnitScheduleItem[]) => void;
  termId?: number;
  readOnly?: boolean;
}

export default function WeeklyTimetable({
  units,
  initialSchedules = [],
  onSchedulesChange,
  termId,
  readOnly = false,
}: WeeklyTimetableProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<UnitScheduleItem[]>(initialSchedules);
  const [activeItem, setActiveItem] = useState<UnitScheduleItem | null>(null);
  const [showUnits, setShowUnits] = useState(true);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (initialSchedules) {
      setSchedules(initialSchedules);
    }
  }, [initialSchedules]);

  useEffect(() => {
    if (onSchedulesChange) {
      onSchedulesChange(schedules);
    }
  }, [schedules, onSchedulesChange]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    // Handle drag from units list
    if (typeof active.id === 'number') {
      const unit = units.find(u => u.id === active.id);
      
      if (unit) {
        setActiveItem({
          id: `new-${Date.now()}`,
          unitId: unit.id,
          unitName: unit.name,
          unitCode: unit.code,
          dayOfWeek: 1, // Default to Monday
          startTime: "10:00",
          endTime: "12:00",
          location: "TBD",
          durationHours: 2
        });
      }
      return;
    }
    
    // Handle drag from existing schedules
    const draggedItem = schedules.find(item => item.id === active.id);
    if (draggedItem) {
      setActiveItem(draggedItem);
    }
  }, [schedules, units]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    
    if (!over) return;
    
    // New item being added to the timetable
    if (typeof active.id === 'number' && over.id) {
      const [dayId, timeId] = String(over.id).split('-');
      const dayOfWeek = parseInt(dayId);
      const hour = parseInt(timeId);
      
      const unit = units.find(u => u.id === active.id);
      if (!unit) return;
      
      const newSchedule: UnitScheduleItem = {
        id: `schedule-${Date.now()}`,
        unitId: unit.id,
        unitName: unit.name,
        unitCode: unit.code,
        dayOfWeek,
        startTime: `${hour}:00`,
        endTime: `${hour + 2}:00`,
        location: "Room TBD",
        durationHours: 2
      };
      
      setSchedules(prev => [...prev, newSchedule]);
      
      toast({
        title: "Schedule Added",
        description: `${unit.code} added to ${daysOfWeek.find(d => d.id === dayOfWeek)?.name} at ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      });
      
      return;
    }
    
    // Existing item being moved
    if (typeof active.id === 'string' && over.id) {
      const [dayId, timeId] = String(over.id).split('-');
      const dayOfWeek = parseInt(dayId);
      const hour = parseInt(timeId);
      
      const itemIndex = schedules.findIndex(item => item.id === active.id);
      if (itemIndex === -1) return;
      
      const updatedSchedules = [...schedules];
      const item = { ...updatedSchedules[itemIndex] };
      
      // Update the day and time
      item.dayOfWeek = dayOfWeek;
      item.startTime = `${hour}:00`;
      item.endTime = `${hour + item.durationHours}:00`;
      
      updatedSchedules[itemIndex] = item;
      setSchedules(updatedSchedules);
      
      toast({
        title: "Schedule Updated",
        description: `${item.unitCode} moved to ${daysOfWeek.find(d => d.id === dayOfWeek)?.name} at ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      });
    }
  }, [schedules, toast, units]);

  const handleRemoveSchedule = (id: string | number) => {
    if (readOnly) return;
    
    setSchedules(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: "Schedule Removed",
      description: "The schedule has been removed from the timetable",
    });
  };

  // Get background color based on unit code for consistency
  const getUnitColor = (unitCode: string) => {
    const colors = [
      "bg-blue-100 border-blue-300 text-blue-800",
      "bg-green-100 border-green-300 text-green-800",
      "bg-amber-100 border-amber-300 text-amber-800",
      "bg-purple-100 border-purple-300 text-purple-800",
      "bg-pink-100 border-pink-300 text-pink-800",
      "bg-indigo-100 border-indigo-300 text-indigo-800",
      "bg-cyan-100 border-cyan-300 text-cyan-800"
    ];
    
    // Simple hash function to get consistent color for the same unit code
    let hash = 0;
    for (let i = 0; i < unitCode.length; i++) {
      hash = (hash + unitCode.charCodeAt(i)) % colors.length;
    }
    
    return colors[hash];
  };

  // Check if a time slot is occupied
  const isSlotOccupied = (dayId: number, hour: number, currentItemId: string | number | null = null) => {
    return schedules.some(item => {
      if (item.id === currentItemId) return false;
      
      const startHour = parseInt(item.startTime.split(':')[0]);
      const endHour = parseInt(item.endTime.split(':')[0]);
      
      return (
        item.dayOfWeek === dayId &&
        hour >= startHour &&
        hour < endHour
      );
    });
  };

  // Render a schedule item
  const renderScheduleItem = (item: UnitScheduleItem) => {
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    const durationHours = endHour - startHour;
    
    const colorClass = getUnitColor(item.unitCode);
    
    return (
      <div 
        className={`absolute left-0 right-0 z-10 p-2 border rounded-md shadow-sm ${colorClass}`}
        style={{ 
          top: `${(startHour - 8) * 60}px`,
          height: `${durationHours * 60 - 6}px`,
          opacity: activeItem?.id === item.id ? 0.5 : 1
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-sm">{item.unitCode}</div>
            <div className="text-xs truncate">{item.unitName}</div>
          </div>
          {!readOnly && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={() => handleRemoveSchedule(item.id)}
            >
              <Trash className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="mt-1 text-xs flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {startHour > 12 ? startHour - 12 : startHour}:00 
          {startHour >= 12 ? 'PM' : 'AM'} - 
          {endHour > 12 ? endHour - 12 : endHour}:00
          {endHour >= 12 ? 'PM' : 'AM'}
        </div>
        <div className="mt-1 text-xs">{item.location}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Weekly Timetable</h3>
          <p className="text-sm text-muted-foreground">
            {readOnly 
              ? "View your weekly schedule" 
              : "Drag units to the timetable to create schedules"}
          </p>
        </div>
        
        {!readOnly && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUnits(!showUnits)}
          >
            {showUnits ? "Hide Units List" : "Show Units List"}
          </Button>
        )}
      </div>
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[snapCenterToCursor]}
      >
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          {/* Units list */}
          {!readOnly && showUnits && (
            <div className="md:col-span-2 space-y-2">
              <h4 className="font-medium text-sm">Available Units</h4>
              <Card>
                <CardContent className="p-4 space-y-2">
                  {units.map(unit => (
                    <div
                      key={unit.id}
                      className="border p-2 rounded-md cursor-move flex items-center bg-white hover:bg-slate-50"
                      data-unit-id={unit.id}
                    >
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{unit.code}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {unit.name}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {units.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No units available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Timetable */}
          <div className={`${!readOnly && showUnits ? 'md:col-span-6' : 'md:col-span-8'} overflow-x-auto`}>
            <div className="min-w-[800px]">
              {/* Timetable header */}
              <div className="grid grid-cols-8 border-b">
                <div className="h-12 flex items-center justify-center font-medium text-sm text-muted-foreground">
                  Time
                </div>
                {daysOfWeek.map(day => (
                  <div
                    key={day.id}
                    className="h-12 flex items-center justify-center font-medium text-sm"
                  >
                    {day.name}
                  </div>
                ))}
              </div>
              
              {/* Time slots */}
              <div className="relative">
                {timeSlots.map(slot => (
                  <div key={slot.id} className="grid grid-cols-8 border-b">
                    <div className="h-[60px] flex items-center justify-center text-sm text-muted-foreground border-r">
                      {slot.displayTime}
                    </div>
                    
                    {daysOfWeek.map(day => (
                      <div
                        key={`${day.id}-${slot.hour}`}
                        id={`${day.id}-${slot.hour}`}
                        className={`h-[60px] border-r relative ${
                          isSlotOccupied(day.id, slot.hour) 
                            ? 'bg-gray-50' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {/* Render schedule items for this day and time */}
                        {schedules
                          .filter(item => {
                            const startHour = parseInt(item.startTime.split(':')[0]);
                            return item.dayOfWeek === day.id && startHour === slot.hour;
                          })
                          .map(item => renderScheduleItem(item))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Drag overlay */}
        <DragOverlay>
          {activeItem && (
            <div className={`p-2 border rounded-md shadow-md ${getUnitColor(activeItem.unitCode)}`} style={{ width: '150px' }}>
              <div className="font-medium text-sm">{activeItem.unitCode}</div>
              <div className="text-xs truncate">{activeItem.unitName}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}