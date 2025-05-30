import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, GraduationCap, Users, Calendar, Edit, Trash2, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema, type Class, type InsertClass } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function ClassesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { toast } = useToast();

  // Fetch classes data
  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Fetch courses for the dropdown
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch academic terms for the dropdown
  const { data: terms = [] } = useQuery<any[]>({
    queryKey: ['/api/academic-terms'],
  });

  // Fetch departments for the dropdown
  const { data: departments = [], refetch: refetchDepartments } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });



  // Listen for department updates to refresh data automatically
  useEffect(() => {
    const handleDepartmentUpdate = () => {
      refetchDepartments();
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    };

    window.addEventListener('departmentUpdated', handleDepartmentUpdate);
    return () => window.removeEventListener('departmentUpdated', handleDepartmentUpdate);
  }, [refetchDepartments]);

  // Fetch sections for the dropdown
  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['/api/sections'],
  });

  // Fetch levels for the dropdown
  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ['/api/levels'],
  });

  // Fetch units for assignment
  const { data: availableUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/units'],
  });

  // Fetch students for enrollment - filtered by class department
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/users', selectedClass?.departmentId],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      const allUsers = await res.json();
      return allUsers.filter((user: any) => 
        user.role === 'student' && 
        (!selectedClass?.departmentId || user.departmentId === selectedClass.departmentId)
      );
    },
    enabled: !!selectedClass?.id,
  });

  // Fetch enrollments for selected class
  const { data: classEnrollments = [], refetch: refetchEnrollments } = useQuery<any[]>({
    queryKey: ['/api/classes', selectedClass?.id, 'enrollments'],
    queryFn: async () => {
      if (!selectedClass?.id) return [];
      const res = await fetch(`/api/classes/${selectedClass.id}/enrollments`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!selectedClass?.id,
  });

  // Fetch units assigned to selected class
  const { data: classUnits = [], refetch: refetchClassUnits } = useQuery<any[]>({
    queryKey: ['/api/classes', selectedClass?.id, 'units'],
    queryFn: async () => {
      if (!selectedClass?.id) return [];
      const res = await fetch(`/api/classes/${selectedClass.id}/units`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!selectedClass?.id,
  });

  // Sync class units with selected units when editing
  useEffect(() => {
    if (classUnits.length > 0 && isEditDialogOpen) {
      const unitIds = classUnits.map((unit: any) => unit.id);
      setSelectedUnits(unitIds);
    }
  }, [classUnits, isEditDialogOpen]);


  // State for selected units
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  
  // State for student enrollment management
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // State for department filtering
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Enrollment mutations
  const enrollStudentsMutation = useMutation({
    mutationFn: async ({ studentIds, classId, courseId, termId }: { 
      studentIds: number[], 
      classId: number, 
      courseId: number, 
      termId: number 
    }) => {
      const res = await apiRequest("POST", "/api/enrollments", { 
        studentIds, 
        classId, 
        courseId, 
        termId 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      refetchEnrollments();
      setSelectedStudents([]);
      setIsManageStudentsOpen(false);
      toast({
        title: "Success",
        description: "Students enrolled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      code: "",
      courseId: 0,
      departmentId: 0,
      sectionId: 0,
      levelId: 0,
      termId: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: "upcoming",
      description: "",
    },
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: InsertClass & { unitIds?: number[] }) => {
      const res = await apiRequest("POST", "/api/classes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedUnits([]);
      toast({
        title: "Success",
        description: "Class created successfully with assigned units",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClass> }) => {
      const res = await apiRequest("PATCH", `/api/classes/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsEditDialogOpen(false);
      setSelectedClass(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/classes/${id}`);
      // DELETE returns 204 with no content
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit form setup
  const editForm = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema.extend({
      departmentId: z.number().min(1, "Department is required"),
      sectionId: z.number().min(1, "Section is required"), 
      levelId: z.number().min(1, "Level is required"),
    })),
  });

  const onSubmit = (data: InsertClass) => {
    createClassMutation.mutate({
      ...data,
      unitIds: selectedUnits
    });
  };

  const onEditSubmit = (data: InsertClass) => {
    if (selectedClass) {
      updateClassMutation.mutate({ id: selectedClass.id, data });
    }
  };

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    editForm.reset({
      name: classItem.name,
      code: classItem.code,
      courseId: classItem.courseId,
      termId: classItem.termId,
      departmentId: classItem.departmentId,
      sectionId: classItem.sectionId,
      levelId: classItem.levelId,
      startDate: new Date(classItem.startDate),
      endDate: new Date(classItem.endDate),
      description: classItem.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const openManageStudentsDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsManageStudentsOpen(true);
  };

  const handleEnrollStudents = () => {
    if (!selectedClass || selectedStudents.length === 0) return;
    
    enrollStudentsMutation.mutate({
      studentIds: selectedStudents,
      classId: selectedClass.id,
      courseId: selectedClass.courseId,
      termId: selectedClass.termId
    });
  };

  const getEnrolledStudentIds = () => {
    return classEnrollments.map((enrollment: any) => enrollment.studentId);
  };

  const getAvailableStudents = () => {
    const enrolledIds = getEnrolledStudentIds();
    return students.filter((student: any) => !enrolledIds.includes(student.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading classes...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage student intakes and class assignments
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class for managing student intakes
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web Development Jan 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., WD-JAN24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={(value) => {
                        const deptId = parseInt(value);
                        field.onChange(deptId);
                        setSelectedDepartmentId(deptId);
                        // Reset dependent fields when department changes
                        form.setValue("sectionId", 0);
                        form.setValue("courseId", 0);
                        setSelectedUnits([]);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "0" ? null : parseInt(value))}
                        disabled={!selectedDepartmentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !selectedDepartmentId 
                                ? "Select department first" 
                                : "Select section (optional)"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">No specific section</SelectItem>
                          {sections
                            .filter((section: any) => section.departmentId === selectedDepartmentId)
                            .map((section: any) => (
                              <SelectItem key={section.id} value={section.id.toString()}>
                                {section.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="levelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((level: any) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!selectedDepartmentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !selectedDepartmentId 
                                ? "Select department first" 
                                : "Select a course"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses
                            .filter((course: any) => course.departmentId === selectedDepartmentId)
                            .map((course: any) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="termId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Term</FormLabel>
                      <Select onValueChange={(value) => {
                        const termId = parseInt(value);
                        field.onChange(termId);
                        
                        // Auto-populate start and end dates from selected term
                        const selectedTerm = terms.find((term: any) => term.id === termId);
                        if (selectedTerm) {
                          form.setValue('startDate', new Date(selectedTerm.startDate));
                          form.setValue('endDate', new Date(selectedTerm.endDate));
                        }
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a term" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {terms.map((term: any) => (
                            <SelectItem key={term.id} value={term.id.toString()}>
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (from Term)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (from Term)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Class description (optional)"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Assignment Section */}
                <div className="space-y-3">
                  <FormLabel>Assign Units to Class</FormLabel>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {selectedDepartmentId ? (
                      availableUnits
                        .filter((unit: any) => {
                          // Filter units by those belonging to courses in the selected department
                          const unitCourse = courses.find((course: any) => course.id === unit.courseId);
                          return unitCourse && unitCourse.departmentId === selectedDepartmentId;
                        })
                        .map((unit: any) => (
                          <div key={unit.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`unit-${unit.id}`}
                              checked={selectedUnits.includes(unit.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUnits(prev => [...prev, unit.id]);
                                } else {
                                  setSelectedUnits(prev => prev.filter(id => id !== unit.id));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`unit-${unit.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {unit.name} ({unit.code})
                            </label>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a department first to see available units.</p>
                    )}
                    {selectedDepartmentId && availableUnits.filter((unit: any) => {
                      const unitCourse = courses.find((course: any) => course.id === unit.courseId);
                      return unitCourse && unitCourse.departmentId === selectedDepartmentId;
                    }).length === 0 && (
                      <p className="text-sm text-muted-foreground">No units available for this department. Create units first.</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which units will be taught in this class. Students enrolled in the class will be able to attend sessions for these units.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createClassMutation.isPending}
                  >
                    {createClassMutation.isPending ? "Creating..." : "Create Class"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(classes as any[]).length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No classes found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first class to start managing student intakes
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Class
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          (classes as any[]).map((classItem: any) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <CardDescription>{classItem.code}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(classItem.status)}>
                    {classItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {classItem.currentStudents || 0} students enrolled
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(classItem.startDate), "MMM dd, yyyy")} - {format(new Date(classItem.endDate), "MMM dd, yyyy")}
                  </div>
                  
                  {classItem.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {classItem.description}
                    </p>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openManageStudentsDialog(classItem)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Manage Students
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pb-6">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map((section: any) => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="levelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level: any) => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Term</FormLabel>
                    <Select onValueChange={(value) => {
                      const termId = parseInt(value);
                      field.onChange(termId);
                      
                      // Auto-populate start and end dates from selected term
                      const selectedTerm = terms.find((term: any) => term.id === termId);
                      if (selectedTerm) {
                        editForm.setValue('startDate', new Date(selectedTerm.startDate));
                        editForm.setValue('endDate', new Date(selectedTerm.endDate));
                      }
                    }} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms.map((term: any) => (
                          <SelectItem key={term.id} value={term.id.toString()}>
                            {term.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (from Term)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (from Term)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter class description" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Assignment Section for Edit */}
              <div className="space-y-3">
                <FormLabel>Assign Units to Class</FormLabel>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availableUnits.map((unit: any) => (
                    <div key={unit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-unit-${unit.id}`}
                        checked={selectedUnits.includes(unit.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUnits(prev => [...prev, unit.id]);
                          } else {
                            setSelectedUnits(prev => prev.filter(id => id !== unit.id));
                          }
                        }}
                      />
                      <label 
                        htmlFor={`edit-unit-${unit.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {unit.name} ({unit.code})
                      </label>
                    </div>
                  ))}
                  {availableUnits.length === 0 && (
                    <p className="text-sm text-muted-foreground">No units available. Create units first.</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which units will be taught in this class. Students enrolled in the class will be able to attend sessions for these units.
                </p>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Class
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClassMutation.isPending}>
                    {updateClassMutation.isPending ? "Updating..." : "Update Class"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Students - {selectedClass?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Add students to this class individually or in bulk. Only students from the {departments.find(d => d.id === selectedClass?.departmentId)?.name || 'same'} department are shown.
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Currently Enrolled Students */}
            <div>
              <h3 className="text-lg font-medium mb-3">Currently Enrolled Students ({classEnrollments.length})</h3>
              {classEnrollments.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="grid gap-2">
                    {classEnrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{enrollment.studentName}</span>
                          <span className="text-sm text-muted-foreground ml-2">({enrollment.studentUsername})</span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {enrollment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
                  No students enrolled yet. Add students below to get started.
                </p>
              )}
            </div>

            {/* Add New Students */}
            <div>
              <h3 className="text-lg font-medium mb-3">Add New Students</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Available Students ({getAvailableStudents().length})</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Students from {departments.find(d => d.id === selectedClass?.departmentId)?.name || 'this'} department only. Select students for bulk enrollment.
                  </p>
                </div>

                {getAvailableStudents().length > 0 ? (
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="grid gap-2">
                      {getAvailableStudents().map((student: any) => (
                        <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudents(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`student-${student.id}`}
                            className="flex-1 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium">{student.fullName}</span>
                              <span className="text-sm text-muted-foreground ml-2">({student.username})</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const availableIds = getAvailableStudents().map((s: any) => s.id);
                            setSelectedStudents(availableIds);
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudents([])}
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {selectedStudents.length} selected
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>All available students are already enrolled in this class.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsManageStudentsOpen(false);
                  setSelectedStudents([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleEnrollStudents}
                disabled={selectedStudents.length === 0 || enrollStudentsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enrollStudentsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This action cannot be undone and will remove all associated data including student enrollments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => {
                if (selectedClass) {
                  deleteClassMutation.mutate(selectedClass.id);
                }
              }}
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? "Deleting..." : "Delete Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </DashboardLayout>
  );
}