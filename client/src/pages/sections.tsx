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
  Layers, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Loader2,
  Filter
} from "lucide-react";

interface Section {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    departmentId: ""
  });

  // Fetch sections and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from real API
        const sectionsResponse = await fetch('/api/sections');
        const departmentsResponse = await fetch('/api/departments');
        
        if (!sectionsResponse.ok || !departmentsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const sectionsData = await sectionsResponse.json();
        const departmentsData = await departmentsResponse.json();
        
        // Process sections data to include department name
        const processedSections = sectionsData.map((section: any) => {
          const department = departmentsData.find((dept: Department) => dept.id === section.departmentId);
          return {
            ...section,
            departmentName: department ? department.name : 'Unknown Department'
          };
        });
        
        setDepartments(departmentsData);
        setSections(processedSections);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load sections. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCreateSection = () => {
    setSelectedSection(null);
    setFormValues({
      name: "",
      departmentId: ""
    });
    setIsDialogOpen(true);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setFormValues({
      name: section.name,
      departmentId: section.departmentId.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSection = (section: Section) => {
    setSelectedSection(section);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormValues(prev => ({ ...prev, departmentId: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate inputs
      if (!formValues.name || !formValues.departmentId) {
        setError('Name and department are required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Submit to real API
      const url = selectedSection 
        ? `/api/sections/${selectedSection.id}` 
        : '/api/sections';
      const method = selectedSection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formValues.name,
          departmentId: parseInt(formValues.departmentId)
        })
      });
      
      if (!response.ok) throw new Error('Failed to save section');
      const data = await response.json();
      
      // Get department name for the new/updated section
      const department = departments.find(d => d.id === parseInt(formValues.departmentId));
      
      if (!department) {
        throw new Error('Selected department not found');
      }
      
      // Create section object with API response data
      const newSection: Section = {
        id: data.id,
        name: data.name,
        departmentId: data.departmentId,
        departmentName: department.name
      };
      
      if (selectedSection) {
        // Update existing section
        setSections(sections.map(section => 
          section.id === selectedSection.id ? newSection : section
        ));
      } else {
        // Add new section
        setSections([...sections, newSection]);
      }
      
      setIsDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving section:', error);
      setError('Failed to save section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSection) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit to API
      const response = await fetch(`/api/sections/${selectedSection.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete section');
      
      // Remove from state
      setSections(sections.filter(section => section.id !== selectedSection.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting section:', error);
      setError('Failed to delete section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sections by search query and department
  const filteredSections = sections.filter(section => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !section.name.toLowerCase().includes(query) &&
        !section.departmentName.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    // Apply department filter
    if (departmentFilter && section.departmentId !== parseInt(departmentFilter)) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading sections...</p>
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
            <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
            <p className="text-muted-foreground">
              Manage sections within departments
            </p>
          </div>
          <Button onClick={handleCreateSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sections..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id.toString()}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sections List */}
        <Card>
          <CardHeader>
            <CardTitle>All Sections</CardTitle>
            <CardDescription>
              View and manage departmental sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Layers className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No sections found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSections.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">{section.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                            {section.departmentName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditSection(section)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteSection(section)}
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
              Showing {filteredSections.length} of {sections.length} sections
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Create/Edit Section Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? "Edit Section" : "Create Section"}
            </DialogTitle>
            <DialogDescription>
              {selectedSection
                ? "Update section details"
                : "Add a new section to a department"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Section Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="e.g. Software Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                value={formValues.departmentId}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger id="departmentId">
                  <SelectValue placeholder="Select a department" />
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
                The department this section belongs to
              </p>
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
                "Save Section"
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
              Are you sure you want to delete the section 
              "{selectedSection?.name}"? This action cannot be undone.
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
                "Delete Section"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}