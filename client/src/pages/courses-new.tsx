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
  sectionId?: string | number;
  levelName?: string;
  departmentName?: string;
}

interface Department {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
  departmentId: number;
  departmentName?: string;
}

export default function CoursesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [showDefaultSection, setShowDefaultSection] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState<{
    name: string;
    code: string;
    levelId: string;
    departmentId: string;
    sectionId: string;
  }>({ 
    name: "", 
    code: "",
    levelId: "",
    departmentId: "",
    sectionId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Mock data
  const mockDepartments: Department[] = [
    { id: 1, name: "Computer Science" },
    { id: 2, name: "Business Administration" },
    { id: 3, name: "Engineering" }
  ];

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
      sectionId: 1,
      levelName: "Year 1",
      departmentName: "Computer Science"
    },
    { 
      id: 2, 
      name: "Advanced Computing", 
      code: "AC", 
      levelId: 2,
      departmentId: 1,
      sectionId: 1,
      levelName: "Year 2",
      departmentName: "Computer Science" 
    },
    { 
      id: 3, 
      name: "Bachelor of Business Administration", 
      code: "BBA", 
      levelId: 4,
      departmentId: 2,
      sectionId: 3,
      levelName: "Year 1",
      departmentName: "Business Administration"
    }
  ];
  
  // Fetch user and course data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch current user
        const userResponse = await fetch("/api/user", { credentials: "include" });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Fetch real data from API
          const departmentsResponse = await fetch("/api/departments");
          const levelsResponse = await fetch("/api/levels");
          const sectionsResponse = await fetch("/api/sections");
          
          let departmentsData = [];
          let levelsData = [];
          let sectionsData = [];
          
          if (departmentsResponse.ok) {
            departmentsData = await departmentsResponse.json();
            setDepartments(departmentsData);
          } else {
            console.error("Failed to fetch departments");
            // Fallback to mock data if API fails
            departmentsData = mockDepartments;
            setDepartments(mockDepartments);
          }
          
          if (sectionsResponse.ok) {
            sectionsData = await sectionsResponse.json();
            setSections(sectionsData);
          } else {
            console.error("Failed to fetch sections");
            // Use empty array if API fails
            setSections([]);
          }
          
          if (levelsResponse.ok) {
            levelsData = await levelsResponse.json();
            setLevels(levelsData);
          } else {
            console.error("Failed to fetch levels");
            // Fallback to mock data if API fails
            levelsData = mockLevels;
            setLevels(mockLevels);
          }
          
          // Fetch courses AFTER departments and levels so we can populate names
          const coursesResponse = await fetch("/api/courses");
          if (coursesResponse.ok) {
            let coursesData = await coursesResponse.json();
            
            // Add department and level names to course data
            coursesData = coursesData.map(course => {
              const department = departmentsData.find(d => d.id === course.departmentId);
              const level = levelsData.find(l => l.id === course.levelId);
              return {
                ...course,
                departmentName: department?.name || "Unknown Department",
                levelName: level?.name || "Unknown Level"
              };
            });
            
            setCourses(coursesData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to mock data if API fails
        setCourses(mockCourses);
        setLevels(mockLevels);
        setDepartments(mockDepartments);
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
      if (!newCourse.name || !newCourse.code || !newCourse.levelId || !newCourse.departmentId) {
        setError("Name, code, department and level are required");
        setIsSubmitting(false);
        return;
      }
      
      // Section is required for new courses, but we make it optional in validation
      // to support existing data during the transition period
      
      // Send POST request to create course in database
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCourse.name,
          code: newCourse.code,
          levelId: parseInt(newCourse.levelId),
          departmentId: parseInt(newCourse.departmentId),
          ...(newCourse.sectionId === "default" 
              ? { sectionId: null } 
              : newCourse.sectionId 
                ? { sectionId: parseInt(newCourse.sectionId) } 
                : {})
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add course");
      }
      
      const createdCourse = await response.json();
      
      // Add department and level names to the created course
      const department = departments.find(d => d.id === createdCourse.departmentId);
      const level = levels.find(l => l.id === createdCourse.levelId);
      
      const enrichedCourse = {
        ...createdCourse,
        departmentName: department?.name || "Unknown Department",
        levelName: level?.name || "Unknown Level"
      };
      
      setCourses([...courses, enrichedCourse]);
      setNewCourse({ 
        name: "", 
        code: "", 
        levelId: "", 
        departmentId: "",
        sectionId: ""
      });
      setFilteredSections([]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding course:", error);
      setError("Failed to add course");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditCourse = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send PUT request to update course in database
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedCourse.name,
          code: selectedCourse.code,
          levelId: parseInt(selectedCourse.levelId.toString()),
          departmentId: parseInt(selectedCourse.departmentId.toString()),
          ...(selectedCourse.sectionId === "default" 
            ? { sectionId: null } 
            : selectedCourse.sectionId 
              ? { sectionId: parseInt(selectedCourse.sectionId.toString()) } 
              : {})
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update course: ${errorText}`);
      }
      
      // Get updated course data
      const updatedCourseData = await response.json();
      
      const level = levels.find(l => l.id === updatedCourseData.levelId);
      
      const updatedCourse = {
        ...updatedCourseData,
        levelName: level?.name,
        departmentName: level?.departmentName
      };
      
      const updatedCourses = courses.map(course => 
        course.id === selectedCourse.id ? updatedCourse : course
      );
      
      setCourses(updatedCourses);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating course:", error);
      setError("Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    
    try {
      // In a real app, send DELETE request
      // const response = await fetch(`/api/courses/${selectedCourse.id}`, {
      //   method: "DELETE"
      // });
      
      // if (!response.ok) throw new Error("Failed to delete course");
      
      // Mock deleting course
      const filteredCourses = courses.filter(course => course.id !== selectedCourse.id);
      setCourses(filteredCourses);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course");
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
      
      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new academic course
            </DialogDescription>
          </DialogHeader>
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
                onValueChange={(value) => {
                  // Update newCourse state with new department and reset section
                  setNewCourse({ ...newCourse, departmentId: value, sectionId: "" });
                  
                  // Filter sections based on selected department
                  const departmentId = parseInt(value);
                  const filteredSecs = sections.filter(section => 
                    section.departmentId === departmentId
                  );
                  
                  setFilteredSections(filteredSecs);
                  
                  // If there are no sections for this department, show DEFAULT SECTION option
                  // and automatically select it
                  if (filteredSecs.length === 0 && value) {
                    setShowDefaultSection(true);
                    setNewCourse(prev => ({...prev, departmentId: value, sectionId: "default"}));
                  } else {
                    setShowDefaultSection(false);
                  }
                  
                  console.log("Department changed to:", value);
                  console.log("Filtered sections:", filteredSecs);
                  console.log("Show default section:", filteredSecs.length === 0);
                }}
              >
                <SelectTrigger id="department">
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
              <p className="text-xs text-muted-foreground">
                Department the course belongs to
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section <span className="text-red-500">*</span></Label>
              <Select
                value={newCourse.sectionId}
                onValueChange={(value) => setNewCourse({ ...newCourse, sectionId: value })}
                disabled={!newCourse.departmentId}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder={
                    !newCourse.departmentId 
                      ? "Select department first" 
                      : "Select section"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {/* Default section option for departments without sections */}
                  {showDefaultSection && (
                    <SelectItem key="default" value="default">
                      DEFAULT SECTION
                    </SelectItem>
                  )}
                  
                  {/* Department-specific sections */}
                  {filteredSections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Section within the department
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
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name} - {level.departmentName}
                      {level.sectionName && ` (${level.sectionName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
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
                  value={selectedCourse.name} 
                  onChange={(e) => setSelectedCourse({ 
                    ...selectedCourse, 
                    name: e.target.value 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Course Code</Label>
                <Input 
                  id="edit-code" 
                  value={selectedCourse.code} 
                  onChange={(e) => setSelectedCourse({ 
                    ...selectedCourse, 
                    code: e.target.value 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={selectedCourse.departmentId ? selectedCourse.departmentId.toString() : ""}
                  onValueChange={(value) => {
                    setSelectedCourse({ 
                      ...selectedCourse, 
                      departmentId: parseInt(value),
                      // Clear section when department changes
                      sectionId: undefined
                    });
                  }}
                >
                  <SelectTrigger id="edit-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Select
                  value={selectedCourse.sectionId ? selectedCourse.sectionId.toString() : ""}
                  onValueChange={(value) => setSelectedCourse({ ...selectedCourse, sectionId: value })}
                  disabled={!selectedCourse.departmentId}
                >
                  <SelectTrigger id="edit-section">
                    <SelectValue placeholder={
                      !selectedCourse.departmentId 
                        ? "Select department first" 
                        : "Select section"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Default section option for departments without sections */}
                    {selectedCourse.departmentId && 
                     sections.filter(s => s.departmentId === selectedCourse.departmentId).length === 0 && (
                      <SelectItem key="default" value="default">
                        DEFAULT SECTION
                      </SelectItem>
                    )}
                    
                    {/* Department-specific sections */}
                    {sections
                      .filter(s => s.departmentId === selectedCourse.departmentId)
                      .map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-level">Level</Label>
                <Select
                  value={selectedCourse.levelId.toString()}
                  onValueChange={(value) => setSelectedCourse({ 
                    ...selectedCourse, 
                    levelId: parseInt(value) 
                  })}
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
      
      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="py-4">
              <p className="font-medium">{selectedCourse.name} ({selectedCourse.code})</p>
              <p className="text-sm text-muted-foreground">
                Level: {selectedCourse.levelName}, Department: {selectedCourse.departmentName}
              </p>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
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
    </DashboardLayout>
  );
}