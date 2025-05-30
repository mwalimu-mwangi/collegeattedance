import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Save, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Teacher {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

interface Unit {
  id: number;
  name: string;
  code: string;
  courseId: number;
  courseName?: string;
  teacherId: number | null;
  teacherName?: string;
}

export default function AssignTeachersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for teachers and units
  const mockTeachers: Teacher[] = [
    { id: 1, fullName: "John Smith", username: "jsmith", email: "john.smith@college.edu" },
    { id: 2, fullName: "Sarah Johnson", username: "sjohnson", email: "sarah.johnson@college.edu" },
    { id: 3, fullName: "Michael Brown", username: "mbrown", email: "michael.brown@college.edu" },
    { id: 4, fullName: "Emily Davis", username: "edavis", email: "emily.davis@college.edu" }
  ];

  const mockUnits: Unit[] = [
    { 
      id: 1, 
      name: "Introduction to Programming", 
      code: "CS101", 
      courseId: 1,
      courseName: "Bachelor of Computer Science",
      teacherId: 1,
      teacherName: "John Smith"
    },
    { 
      id: 2, 
      name: "Data Structures", 
      code: "CS201", 
      courseId: 1,
      courseName: "Bachelor of Computer Science",
      teacherId: null,
      teacherName: null
    },
    { 
      id: 3, 
      name: "Web Development", 
      code: "CS204", 
      courseId: 1,
      courseName: "Bachelor of Computer Science",
      teacherId: 2,
      teacherName: "Sarah Johnson"
    },
    { 
      id: 4, 
      name: "Database Systems", 
      code: "CS302", 
      courseId: 1,
      courseName: "Bachelor of Computer Science",
      teacherId: null,
      teacherName: null
    },
    { 
      id: 5, 
      name: "Marketing Principles", 
      code: "MK101", 
      courseId: 3,
      courseName: "Bachelor of Business Administration",
      teacherId: null,
      teacherName: null
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, fetch data from API
        // const teachersResponse = await fetch("/api/users?role=teacher");
        // const unitsResponse = await fetch("/api/units");
        
        // const teachersData = await teachersResponse.json();
        // const unitsData = await unitsResponse.json();
        
        // Using mock data for now
        setTeachers(mockTeachers);
        setUnits(mockUnits);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleAssignTeacher = async () => {
    if (!selectedUnit) return;
    setIsSubmitting(true);
    
    try {
      // In a real app, send PUT request
      // const response = await fetch(`/api/units/${selectedUnit.id}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     teacherId: selectedTeacher ? parseInt(selectedTeacher) : null
      //   })
      // });
      
      // if (!response.ok) throw new Error("Failed to assign teacher");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const teacherId = selectedTeacher ? parseInt(selectedTeacher) : null;
      const teacher = teacherId ? teachers.find(t => t.id === teacherId) : null;
      
      // Update units list
      const updatedUnits = units.map(unit => {
        if (unit.id === selectedUnit.id) {
          return {
            ...unit,
            teacherId,
            teacherName: teacher ? teacher.fullName : null
          };
        }
        return unit;
      });
      
      setUnits(updatedUnits);
      setIsAssignDialogOpen(false);
      
      toast({
        title: "Success",
        description: teacherId 
          ? `Teacher successfully assigned to ${selectedUnit.name}` 
          : `Teacher removed from ${selectedUnit.name}`,
      });
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast({
        title: "Error",
        description: "Failed to assign teacher. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Assign Teachers to Units</h2>
            <p className="text-muted-foreground">
              Manage which teacher is responsible for each unit
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Unit Assignments</CardTitle>
            <CardDescription>
              View and manage teacher assignments for all units
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Assigned Teacher</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.code}</TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.courseName}</TableCell>
                      <TableCell>
                        {unit.teacherId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {unit.teacherName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUnit(unit);
                            setSelectedTeacher(unit.teacherId ? unit.teacherId.toString() : "");
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          {unit.teacherId ? "Change" : "Assign"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to Unit</DialogTitle>
            <DialogDescription>
              {selectedUnit?.teacherId 
                ? "Change the teacher assigned to this unit or remove the assignment."
                : "Select a teacher to assign to this unit."}
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4 py-2">
              <div>
                <p className="font-medium">{selectedUnit.name} ({selectedUnit.code})</p>
                <p className="text-sm text-muted-foreground">
                  Course: {selectedUnit.courseName}
                </p>
              </div>
              
              <div className="space-y-2">
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Unassigned)</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTeacher} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}