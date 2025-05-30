import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Calendar as CalendarIcon, Plus, Loader2, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AcademicTerm, InsertAcademicTerm } from "@shared/schema";

export default function AcademicTermsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null);
  const [newTerm, setNewTerm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    weekCount: 12,
    isActive: false
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Fetch academic terms from backend
  const { data: terms = [], isLoading, error } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/academic-terms"],
  });

  // Create term mutation
  const createTermMutation = useMutation({
    mutationFn: async (termData: InsertAcademicTerm) => {
      // Ensure dates are properly formatted as ISO strings
      const formattedData = {
        ...termData,
        startDate: termData.startDate instanceof Date ? termData.startDate.toISOString() : termData.startDate,
        endDate: termData.endDate instanceof Date ? termData.endDate.toISOString() : termData.endDate,
      };
      const response = await apiRequest("POST", "/api/academic-terms", formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-terms"] });
      setIsAddDialogOpen(false);
      setNewTerm({ name: "", startDate: "", endDate: "", weekCount: 12, isActive: false });
      setStartDate(undefined);
      setEndDate(undefined);
      toast({
        title: "Success",
        description: "Academic term created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create academic term",
        variant: "destructive",
      });
    },
  });

  // Update term mutation
  const updateTermMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<AcademicTerm> }) => {
      const response = await apiRequest("PATCH", `/api/academic-terms/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-terms"] });
      toast({
        title: "Success",
        description: "Academic term updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update academic term",
        variant: "destructive",
      });
    },
  });

  const handleCreateTerm = () => {
    if (!newTerm.name || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const termData: InsertAcademicTerm = {
      name: newTerm.name,
      startDate: startDate,
      endDate: endDate,
      weekCount: newTerm.weekCount,
      isActive: newTerm.isActive,
    };

    createTermMutation.mutate(termData);
  };

  const handleToggleActive = (term: AcademicTerm) => {
    updateTermMutation.mutate({
      id: term.id,
      updates: { isActive: !term.isActive }
    });
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-destructive">Error loading academic terms</h3>
            <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Academic Terms</h2>
            <p className="text-muted-foreground">
              Manage school terms and their schedules
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Term
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Terms</CardTitle>
            <CardDescription>
              Academic terms and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading academic terms...</span>
              </div>
            ) : terms.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No academic terms found</h3>
                <p className="text-muted-foreground">Add your first academic term to get started</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Term
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Weeks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell>{formatDateDisplay(term.startDate)}</TableCell>
                        <TableCell>{formatDateDisplay(term.endDate)}</TableCell>
                        <TableCell>{term.weekCount} weeks</TableCell>
                        <TableCell>
                          {term.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(term)}
                              disabled={updateTermMutation.isPending}
                            >
                              {term.isActive ? "Deactivate" : "Activate"}
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
        </Card>
      </div>
      
      {/* Add Term Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Academic Term</DialogTitle>
            <DialogDescription>
              Create a new academic term with start and end dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Term Name</Label>
              <Input 
                id="name" 
                value={newTerm.name} 
                onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                placeholder="e.g. Fall 2023"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weekCount">Week Count</Label>
              <Input 
                id="weekCount" 
                type="number"
                min="1"
                max="52"
                value={newTerm.weekCount} 
                onChange={(e) => setNewTerm({ ...newTerm, weekCount: parseInt(e.target.value) || 12 })}
                placeholder="12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTerm}
              disabled={createTermMutation.isPending}
            >
              {createTermMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}