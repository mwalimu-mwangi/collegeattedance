import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Loader2,
  Filter
} from "lucide-react";

interface Department {
  id: number;
  name: string;
  code: string;
  headId: number | null;
  headName?: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    code: "",
    headId: ""
  });

  // Fetch departments and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from real API
        const departmentsResponse = await fetch('/api/departments');
        const teachersResponse = await fetch('/api/users?role=teacher,hod');
        
        if (!departmentsResponse.ok || !teachersResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const departmentsData = await departmentsResponse.json();
        const teachersData = await teachersResponse.json();
        
        // Process department data to include head name if needed
        const processedDepartments = departmentsData.map((dept: Department) => {
          if (dept.headId && !dept.headName) {
            const headTeacher = teachersData.find((t: User) => t.id === dept.headId);
            return {
              ...dept,
              headName: headTeacher?.fullName || 'Unknown'
            };
          }
          return dept;
        });
        
        setDepartments(processedDepartments);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load departments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setFormValues({
      name: "",
      code: "",
      headId: ""
    });
    setIsDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setFormValues({
      name: department.name,
      code: department.code,
      headId: department.headId ? department.headId.toString() : ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormValues(prev => ({ ...prev, headId: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate inputs
      if (!formValues.name || !formValues.code) {
        setError('Name and code are required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Submit to API
      const url = selectedDepartment 
        ? `/api/departments/${selectedDepartment.id}` 
        : '/api/departments';
      const method = selectedDepartment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formValues.name,
          code: formValues.code,
          headId: formValues.headId ? parseInt(formValues.headId) : null
        })
      });
      
      if (!response.ok) throw new Error('Failed to save department');
      const data = await response.json();
      
      const newDepartment: Department = {
        id: data.id,
        name: data.name,
        code: data.code,
        headId: data.headId,
        headName: data.headName || (formValues.headId 
          ? teachers.find(t => t.id === parseInt(formValues.headId))?.fullName
          : null)
      };
      
      if (selectedDepartment) {
        // Update existing department
        setDepartments(departments.map(dept => 
          dept.id === selectedDepartment.id ? newDepartment : dept
        ));
      } else {
        // Add new department
        setDepartments([...departments, newDepartment]);
      }
      
      // Force refresh of departments cache in other components
      window.dispatchEvent(new CustomEvent('departmentUpdated'));
      
      setIsDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit to API
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete department');
      
      // Remove from state
      setDepartments(departments.filter(dept => dept.id !== selectedDepartment.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting department:', error);
      setError('Failed to delete department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter departments by search query
  const filteredDepartments = departments.filter(dept => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      (dept.headName && dept.headName.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading departments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">
              Manage academic departments and assign heads
            </p>
          </div>
          <Button onClick={handleCreateDepartment}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search departments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Departments List */}
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>
              View and manage college departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Building className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No departments found matching your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department Head</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>{department.code}</TableCell>
                        <TableCell>
                          {department.headName ? (
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              {department.headName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteDepartment(department)}
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
          <CardFooter className="border-t bg-slate-50 px-6 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {filteredDepartments.length} of {departments.length} departments
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Create/Edit Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment ? "Edit Department" : "Create Department"}
            </DialogTitle>
            <DialogDescription>
              {selectedDepartment
                ? "Update department details and assigned head"
                : "Add a new academic department to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                name="code"
                value={formValues.code}
                onChange={handleInputChange}
                placeholder="e.g. CS"
              />
              <p className="text-xs text-muted-foreground">
                A short code or abbreviation for the department
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headId">Department Head</Label>
              <Select
                value={formValues.headId}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.filter(teacher => teacher.role === 'hod').map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Department"
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
              Are you sure you want to delete the department 
              "{selectedDepartment?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Department"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}