import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Loader2, Plus, BookOpen, Edit, Trash2 } from "lucide-react";

interface Level {
  id: number;
  name: string;
  departmentId: number;
  sectionId: number | null;
  departmentName?: string;
  sectionName?: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  levelId: number;
  departmentId: number;
  levelName?: string;
  departmentName?: string;
}

export default function CoursesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({ 
    name: "", 
    code: "",
    levelId: "",
    departmentId: ""
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Mock data
  const mockLevels: Level[] = [
    { 
      id: 1, 
      name: "Year 1", 
      departmentId: 1, 
      sectionId: 1, 
      departmentName: "Computer Science",
      sectionName: "Information Technology" 
    },
    { 
      id: 2, 
      name: "Year 2", 
      departmentId: 1, 
      sectionId: 1,
      departmentName: "Computer Science",
      sectionName: "Information Technology"  
    },
    { 
      id: 3, 
      name: "Year 3", 
      departmentId: 1, 
      sectionId: 2,
      departmentName: "Computer Science",
      sectionName: "Software Development"  
    },
    { 
      id: 4, 
      name: "Year 1", 
      departmentId: 2, 
      sectionId: 3,
      departmentName: "Business Administration",
      sectionName: "Marketing"  
    }
  ];
  
  const mockCourses: Course[] = [
    { 
      id: 1, 
      name: "Bachelor of Computer Science", 
      code: "BCS", 
      levelId: 1,
      departmentId: 1,
      levelName: "Year 1",
      departmentName: "Computer Science"
    },
    { 
      id: 2, 
      name: "Advanced Computing", 
      code: "AC", 
      levelId: 2,
      departmentId: 1,
      levelName: "Year 2",
      departmentName: "Computer Science" 
    },
    { 
      id: 3, 
      name: "Bachelor of Business Administration", 
      code: "BBA", 
      levelId: 4,
      departmentId: 2,
      levelName: "Year 1",
      departmentName: "Business Administration"
    }
  ];
  
  // Fetch user and course data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch("/api/user", { credentials: "include" });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Fetch data in parallel for better performance
          try {
            const [departmentsResponse, levelsResponse, coursesResponse] = await Promise.all([
              fetch("/api/departments"),
              fetch("/api/levels"),
              fetch("/api/courses")
            ]);
            
            // Process departments
            if (departmentsResponse.ok) {
              const departmentsData = await departmentsResponse.json();
              console.log("Departments loaded:", departmentsData.length);
              setDepartments(departmentsData);
            } else {
              console.error("Failed to load departments:", departmentsResponse.status);
            }
            
            // Process levels
            if (levelsResponse.ok) {
              const levelsData = await levelsResponse.json();
              console.log("Levels loaded:", levelsData.length);
              setLevels(levelsData);
            } else {
              console.error("Failed to load levels:", levelsResponse.status);
            }
            
            // Process courses
            if (coursesResponse.ok) {
              const coursesData = await coursesResponse.json();
              console.log("Courses loaded:", coursesData.length);
              setCourses(coursesData);
            } else {
              console.error("Failed to load courses:", coursesResponse.status);
            }
          } catch (apiError) {
            console.error("Error fetching API data:", apiError);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleAddCourse = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Validate input
      if (!newCourse.name || newCourse.name.trim() === '') {
        setError("Course name is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!newCourse.code || newCourse.code.trim() === '') {
        setError("Course code is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!newCourse.departmentId) {
        setError("Department selection is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!newCourse.levelId) {
        setError("Level selection is required");
        setIsSubmitting(false);
        return;
      }
      
      // Send POST request to API
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCourse.name.trim(),
          code: newCourse.code.trim(),
          levelId: parseInt(newCourse.levelId),
          departmentId: parseInt(newCourse.departmentId)
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add course: ${errorText}`);
      }
      
      const createdCourse = await response.json();
      
      // If API call succeeds, update the local state
      setCourses([...courses, createdCourse]);
      setNewCourse({ name: "", code: "", levelId: "", departmentId: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding course:", error);
      setError(error instanceof Error ? error.message : "Failed to add course");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditCourse = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send PUT request to API
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedCourse.name,
          code: selectedCourse.code,
          levelId: selectedCourse.levelId,
          departmentId: selectedCourse.departmentId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update course: ${errorText}`);
      }
      
      const updatedCourse = await response.json();
      
      // If API call succeeds, update the local state
      const updatedCourses = courses.map(course => 
        course.id === selectedCourse.id ? updatedCourse : course
      );
      
      setCourses(updatedCourses);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating course:", error);
      setError(error instanceof Error ? error.message : "Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send DELETE request to API
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete course: ${errorText}`);
      }
      
      // If API call succeeds, update the local state
      const filteredCourses = courses.filter(course => course.id !== selectedCourse.id);
      setCourses(filteredCourses);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      setError(error instanceof Error ? error.message : "Failed to delete course");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <DashboardLayout>
      <main>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Courses</h2>
            <p className="text-muted-foreground">Manage academic courses within levels</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              Courses are academic programs offered at specific levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center p-6">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                <p className="text-muted-foreground">Add your first course to get started</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  Add Course
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.levelName}</TableCell>
                        <TableCell>{course.departmentName}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCourse(course);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCourse(course);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-slate-50 p-4">
            <div className="text-sm text-muted-foreground">
              Total courses: {courses.length}
            </div>
          </CardFooter>
        </Card>
      </main>
    </DashboardLayout>
      
    {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new academic course
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddCourse(); }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={newCourse.name} 
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. Bachelor of Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Course Code <span className="text-red-500">*</span></Label>
                <Input 
                  id="code" 
                  value={newCourse.code} 
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="e.g. BCS"
                />
                <p className="text-xs text-muted-foreground">
                  A short unique code for the course
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                <Select
                  value={newCourse.departmentId}
                  onValueChange={(value) => setNewCourse({ ...newCourse, departmentId: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No departments found</div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Department the course belongs to
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level <span className="text-red-500">*</span></Label>
                <Select
                  value={newCourse.levelId}
                  onValueChange={(value) => setNewCourse({ ...newCourse, levelId: value })}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length > 0 ? (
                      levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No levels found</div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Level at which the course is taught
                </p>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCourse} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Course Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedCourse?.name || ""} 
                  onChange={(e) => {
                    if (selectedCourse) {
                      setSelectedCourse({ 
                        ...selectedCourse, 
                        name: e.target.value 
                      });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Course Code</Label>
                <Input 
                  id="edit-code" 
                  value={selectedCourse?.code || ""} 
                  onChange={(e) => {
                    if (selectedCourse) {
                      setSelectedCourse({ 
                        ...selectedCourse, 
                        code: e.target.value 
                      });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={selectedCourse?.departmentId?.toString() || ""}
                  onValueChange={(value) => {
                    if (selectedCourse) {
                      setSelectedCourse({ 
                        ...selectedCourse, 
                        departmentId: parseInt(value)
                      });
                    }
                  }}
                >
                  <SelectTrigger id="edit-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-level">Level</Label>
                <Select
                  value={selectedCourse?.levelId?.toString() || ""}
                  onValueChange={(value) => {
                    if (selectedCourse) {
                      setSelectedCourse({ 
                        ...selectedCourse, 
                        levelId: parseInt(value)
                      });
                    }
                  }}
                >
                  <SelectTrigger id="edit-level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCourse} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course "{selectedCourse?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCourse} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}