import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Search, 
  ChevronRight, 
  CheckCircle, 
  FileText, 
  Clock,
  BookOpen,
  ArrowLeft,
  Users,
  Home,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface Unit {
  id: number;
  name: string;
  code: string;
  courseId: number;
  courseName?: string;
  levelName?: string;
  teacherName?: string;
}

interface Department {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  code: string;
  departmentId: number;
}

interface UnitSchedule {
  id: number;
  unitId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  isActive: boolean;
}

export function SessionsSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Parse the unit ID from the URL if present
  useEffect(() => {
    // Extract unitId from URL like /sessions or /units/:unitId/sessions
    const match = location.match(/\/units\/(\d+)\/sessions/);
    if (match && match[1]) {
      setActiveUnitId(parseInt(match[1]));
    } else if (location === "/sessions") {
      // If we're on the main sessions page, we'll default to the first unit
      unitsData?.length > 0 && setActiveUnitId(unitsData[0].id);
    }
  }, [location]);

  // Fetch units data
  const { data: unitsData = [], isLoading: isUnitsLoading } = useQuery({
    queryKey: ['/api/units'],
    queryFn: async () => {
      const response = await fetch('/api/units');
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    }
  });

  // Fetch departments data
  const { data: departmentsData = [] } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    }
  });

  // Fetch classes data
  const { data: classesData = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }
  });

  // Fetch schedules for the active unit
  const { data: sessionsData = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/units', activeUnitId, 'schedules'],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const response = await fetch(`/api/units/${activeUnitId}/schedules`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: !!activeUnitId
  });

  // Filter units based on search query, department, and class
  const filteredUnits = unitsData.filter((unit: Unit) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        unit.name.toLowerCase().includes(query) || 
        unit.code.toLowerCase().includes(query) ||
        unit.courseName?.toLowerCase().includes(query) ||
        unit.levelName?.toLowerCase().includes(query) ||
        unit.teacherName?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Department filter - we need to get the department through course relationships
    if (selectedDepartment !== "all") {
      // For now, we'll implement this when we have the course-department relationship
      // This would require additional API calls or data structure changes
    }

    // Class filter - units are associated with classes through enrollments
    if (selectedClass !== "all") {
      // This would require checking which classes have this unit assigned
      // This might need additional API endpoints or data structure changes
    }

    return true;
  });

  const isLoading = isUnitsLoading || (activeUnitId && isSessionsLoading);

  return (
    <Card className="h-full max-h-[calc(100vh-2rem)] overflow-hidden border-slate-200">
      <CardHeader className="px-4 py-3 space-y-3">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium">
              {activeUnitId ? "Sessions" : "Units & Sessions"}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <Link href="/units">
                <Users className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {activeUnitId && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-muted-foreground hover:text-primary"
              onClick={() => setActiveUnitId(null)}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Units
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={activeUnitId ? "Search sessions..." : "Search units..."}
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters - Only show when viewing units list */}
        {!activeUnitId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>Filters</span>
            </div>
            
            {/* Department Filter */}
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentsData.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classesData
                  .filter((cls: Class) => selectedDepartment === "all" || cls.departmentId.toString() === selectedDepartment)
                  .map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name} ({cls.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="pl-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No units found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or adding new units
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/units">
                  Manage Units
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filteredUnits.map((unit: Unit) => {
                const isExpanded = activeUnitId === unit.id;
                
                return (
                  <div key={unit.id} className="space-y-1">
                    <div className="px-2">
                      <Button
                        variant={isExpanded ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-between px-2 py-1.5 h-auto text-left",
                          isExpanded && "font-medium bg-slate-100 dark:bg-slate-800"
                        )}
                        onClick={() => {
                          setActiveUnitId(unit.id);
                          window.history.pushState(null, '', `/sessions?unit=${unit.id}`);
                          
                          // Dispatch custom event to notify the main page
                          const event = new CustomEvent('unitSelectionChanged', {
                            detail: { unitId: unit.id }
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <div className="flex items-start space-x-2">
                          <Calendar className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-sm font-medium truncate w-full">{unit.code}</span>
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {unit.name}
                            </span>
                            {unit.courseName && (
                              <span className="text-xs text-blue-600 truncate w-full">
                                Course: {unit.courseName}
                              </span>
                            )}
                            {unit.levelName && (
                              <span className="text-xs text-green-600 truncate w-full">
                                Level: {unit.levelName}
                              </span>
                            )}
                            {unit.teacherName && (
                              <span className="text-xs text-purple-600 truncate w-full">
                                Teacher: {unit.teacherName}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform text-muted-foreground",
                          isExpanded && "rotate-90"
                        )} />
                      </Button>
                    </div>
                    
                    {isExpanded && (
                      <div className="pl-6 space-y-1 py-1">
                        {sessionsData.length === 0 ? (
                          <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                            No schedules found
                          </div>
                        ) : (
                          sessionsData.map((schedule: UnitSchedule) => {
                            return (
                              <Button
                                key={schedule.id}
                                variant="ghost"
                                className="w-full justify-start text-sm px-2 py-1.5 h-auto hover:bg-slate-50 dark:hover:bg-slate-800"
                                asChild
                              >
                                <Link href={`/sessions?unit=${unit.id}&schedule=${schedule.id}`}>
                                  <div className="flex items-start w-full">
                                    {schedule.isActive ? (
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Clock className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex flex-col items-start min-w-0 flex-1">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-sm font-medium truncate">
                                          {schedule.dayOfWeek}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1">
                                          {schedule.startTime} - {schedule.endTime}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground truncate w-full">
                                        {schedule.location || 'No location specified'}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              </Button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}