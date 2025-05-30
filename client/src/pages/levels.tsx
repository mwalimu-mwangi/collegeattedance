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
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Layers,
  Loader2,
  Filter
} from "lucide-react";

interface Level {
  id: number;
  name: string;
}

// No need for Department and Section interfaces anymore since levels are independent

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: ""
  });

  // Fetch levels only
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from real API
        const levelsResponse = await fetch('/api/levels');
        
        if (!levelsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const levelsData = await levelsResponse.json();
        setLevels(levelsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load levels. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // No need for department or section updates anymore since levels are not tied to departments

  const handleCreateLevel = () => {
    setSelectedLevel(null);
    setFormValues({
      name: ""
    });
    setIsDialogOpen(true);
  };

  const handleEditLevel = (level: Level) => {
    setSelectedLevel(level);
    setFormValues({
      name: level.name
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLevel = (level: Level) => {
    setSelectedLevel(level);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Department and section related functions removed

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate inputs
      if (!formValues.name) {
        setError('Level name is required');
        setIsSubmitting(false);
        return;
      }
      
      // Submit to API
      const url = selectedLevel 
        ? `/api/levels/${selectedLevel.id}` 
        : '/api/levels';
      const method = selectedLevel ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formValues.name
        })
      });
      
      if (!response.ok) throw new Error('Failed to save level');
      const data = await response.json();
      
      const newLevel: Level = {
        id: data.id,
        name: data.name
      };
      
      if (selectedLevel) {
        // Update existing level
        setLevels(levels.map(level => 
          level.id === selectedLevel.id ? newLevel : level
        ));
      } else {
        // Add new level
        setLevels([...levels, newLevel]);
      }
      
      setIsDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving level:', error);
      setError('Failed to save level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit to API
      const response = await fetch(`/api/levels/${selectedLevel.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete level');
      
      // Remove from state
      setLevels(levels.filter(level => level.id !== selectedLevel.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting level:', error);
      setError('Failed to delete level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter levels by search query only
  const filteredLevels = levels.filter(level => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!level.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading levels...</p>
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
            <h1 className="text-2xl font-bold tracking-tight">Academic Levels</h1>
            <p className="text-muted-foreground">
              Manage academic levels that can be used across departments
            </p>
          </div>
          <Button onClick={handleCreateLevel}>
            <Plus className="mr-2 h-4 w-4" />
            Add Level
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search levels..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Levels List */}
        <Card>
          <CardHeader>
            <CardTitle>All Levels</CardTitle>
            <CardDescription>
              General academic levels that can be assigned to courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLevels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <GraduationCap className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No levels found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLevels.map((level) => (
                      <TableRow key={level.id}>
                        <TableCell className="font-medium">{level.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>General academic level</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditLevel(level)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteLevel(level)}
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
              Showing {filteredLevels.length} of {levels.length} levels
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Create/Edit Level Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLevel ? "Edit Level" : "Create Level"}
            </DialogTitle>
            <DialogDescription>
              {selectedLevel
                ? "Update level details"
                : "Add a new academic level"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Level Name</Label>
              <Input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="e.g. Level 1, Year 2, Form 3"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Levels are general academic groupings that can be used across departments
            </p>
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
                "Save Level"
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
              Are you sure you want to delete the level 
              "{selectedLevel?.name}"?
              This action cannot be undone.
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
                "Delete Level"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}