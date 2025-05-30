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
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Loader2,
  Search,
  Edit,
  Info,
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface UnitSession {
  id: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  date: string;
  time: string;
  location: string;
  hasRecordOfWork: boolean;
}

interface RecordOfWork {
  id: number;
  sessionId: number;
  topic: string;
  subtopics: string;
  description: string;
  resources: string;
  assignment: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function RecordWorkPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<UnitSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<UnitSession | null>(null);
  const [recordOfWork, setRecordOfWork] = useState<RecordOfWork | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formValues, setFormValues] = useState({
    topic: "",
    subtopics: "",
    description: "",
    resources: "",
    assignment: "",
    notes: ""
  });

  // Fetch user and session data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch('/api/user', { credentials: 'include' });
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        
        const userData = await userResponse.json();
        setUser(userData);
        
        // In a real app, fetch actual data from API
        // For demonstration, we'll use mock data
        const mockSessions: UnitSession[] = [
          {
            id: 101,
            unitId: 1,
            unitName: "Introduction to Programming",
            unitCode: "CS101",
            date: "2023-05-23",
            time: "09:00 - 11:00",
            location: "Room 105",
            hasRecordOfWork: true
          },
          {
            id: 102,
            unitId: 1,
            unitName: "Introduction to Programming",
            unitCode: "CS101",
            date: "2023-05-24",
            time: "09:00 - 11:00",
            location: "Room 105",
            hasRecordOfWork: false
          },
          {
            id: 103,
            unitId: 2,
            unitName: "Web Development",
            unitCode: "CS204",
            date: "2023-05-24",
            time: "14:00 - 16:00",
            location: "Lab 3",
            hasRecordOfWork: true
          },
          {
            id: 104,
            unitId: 3,
            unitName: "Database Systems",
            unitCode: "CS302",
            date: "2023-05-25",
            time: "09:00 - 11:00",
            location: "Room 204",
            hasRecordOfWork: false
          }
        ];
        
        setSessions(mockSessions);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load session data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchRecordOfWork = async (sessionId: number) => {
    try {
      // In a real app, fetch from API
      // const response = await fetch(`/api/sessions/${sessionId}/record`);
      // if (!response.ok) throw new Error('Failed to fetch record of work');
      // const data = await response.json();
      
      // For demonstration, use mock data
      if (sessionId === 101) {
        setRecordOfWork({
          id: 1,
          sessionId: 101,
          topic: "Introduction to Variables and Data Types",
          subtopics: "Variables, Primitive Types, Type Conversion",
          description: "Covered the basic concepts of variables, how to declare and initialize them, and the different primitive data types available in the language.",
          resources: "Chapter 2 of the textbook, Code examples shared in class",
          assignment: "Complete exercises 2.1-2.5 from the textbook",
          notes: "Students showed good understanding of the concepts. Need to spend more time on type conversion in the next class.",
          createdAt: "2023-05-23T11:15:00",
          updatedAt: "2023-05-23T11:15:00"
        });
      } else if (sessionId === 103) {
        setRecordOfWork({
          id: 2,
          sessionId: 103,
          topic: "CSS Layouts and Flexbox",
          subtopics: "Flexbox Model, Responsive Design, Media Queries",
          description: "Introduced students to CSS Flexbox for creating responsive layouts. Demonstrated various flex properties and their applications.",
          resources: "MDN Flexbox documentation, Sample code repository",
          assignment: "Create a responsive navigation bar using flexbox",
          notes: "Most students grasped the concepts well, but some struggled with flex-grow and flex-shrink properties.",
          createdAt: "2023-05-24T16:05:00",
          updatedAt: "2023-05-24T16:05:00"
        });
      } else {
        setRecordOfWork(null);
        // Initialize form with empty values for new record
        setFormValues({
          topic: "",
          subtopics: "",
          description: "",
          resources: "",
          assignment: "",
          notes: ""
        });
      }
    } catch (error) {
      console.error('Error fetching record of work:', error);
      setError('Failed to fetch record details.');
    }
  };

  const handleViewRecord = async (session: UnitSession) => {
    setSelectedSession(session);
    await fetchRecordOfWork(session.id);
    setIsDialogOpen(true);
  };

  const handleCreateRecord = (session: UnitSession) => {
    setSelectedSession(session);
    setRecordOfWork(null);
    setFormValues({
      topic: "",
      subtopics: "",
      description: "",
      resources: "",
      assignment: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSession) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formValues.topic) {
        setError('Topic is required');
        setIsSubmitting(false);
        return;
      }
      
      // In a real app, submit to API
      // const method = recordOfWork ? 'PUT' : 'POST';
      // const url = recordOfWork 
      //   ? `/api/records/${recordOfWork.id}` 
      //   : `/api/sessions/${selectedSession.id}/record`;
      // 
      // const response = await fetch(url, {
      //   method,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formValues)
      // });
      // 
      // if (!response.ok) throw new Error('Failed to save record of work');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the sessions list to reflect the record has been created/updated
      setSessions(sessions.map(session => 
        session.id === selectedSession.id 
          ? { ...session, hasRecordOfWork: true } 
          : session
      ));
      
      setIsDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving record of work:', error);
      setError('Failed to save record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      session.unitName.toLowerCase().includes(query) ||
      session.unitCode.toLowerCase().includes(query) ||
      session.date.includes(query) ||
      session.location.toLowerCase().includes(query)
    );
  });

  // Group sessions by whether they have a record of work or not
  const pendingSessions = filteredSessions.filter(session => !session.hasRecordOfWork);
  const completedSessions = filteredSessions.filter(session => session.hasRecordOfWork);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading sessions data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Record of Work</h1>
          <p className="text-muted-foreground">
            Document and manage your teaching sessions
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sessions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Records
          </Button>
        </div>

        {/* Pending Records Section */}
        {pendingSessions.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                Pending Records
              </CardTitle>
              <CardDescription>
                Sessions that need a record of work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.unitName}</div>
                          <div className="text-sm text-muted-foreground">{session.unitCode}</div>
                        </TableCell>
                        <TableCell>
                          <div>{format(parseISO(session.date), "dd MMM yyyy")}</div>
                          <div className="text-sm text-muted-foreground">{session.time}</div>
                        </TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-amber-500">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            Pending
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCreateRecord(session)}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            Record
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Records Section */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Records</CardTitle>
            <CardDescription>
              Sessions with recorded work
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No records found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.unitName}</div>
                          <div className="text-sm text-muted-foreground">{session.unitCode}</div>
                        </TableCell>
                        <TableCell>
                          <div>{format(parseISO(session.date), "dd MMM yyyy")}</div>
                          <div className="text-sm text-muted-foreground">{session.time}</div>
                        </TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-green-500">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Completed
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewRecord(session)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewRecord(session)}
                            >
                              <Edit className="h-4 w-4" />
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
              Showing {completedSessions.length} of {sessions.filter(s => s.hasRecordOfWork).length} records
            </div>
          </CardFooter>
        </Card>

        {/* Record of Work Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {recordOfWork ? "View/Edit Record of Work" : "Create Record of Work"}
              </DialogTitle>
              <DialogDescription>
                {selectedSession && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">{selectedSession.unitName} ({selectedSession.unitCode})</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {format(parseISO(selectedSession.date), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="mr-1 h-4 w-4" />
                        {selectedSession.time}
                      </div>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="topic">Main Topic <span className="text-red-500">*</span></Label>
                <Input 
                  id="topic" 
                  name="topic"
                  value={recordOfWork ? recordOfWork.topic : formValues.topic} 
                  onChange={handleInputChange}
                  placeholder="e.g. Introduction to Variables"
                  readOnly={!!recordOfWork && !isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtopics">Subtopics</Label>
                <Input 
                  id="subtopics" 
                  name="subtopics"
                  value={recordOfWork ? recordOfWork.subtopics : formValues.subtopics} 
                  onChange={handleInputChange}
                  placeholder="e.g. Data Types, Operators, Type Conversion"
                  readOnly={!!recordOfWork && !isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  value={recordOfWork ? recordOfWork.description : formValues.description} 
                  onChange={handleInputChange}
                  placeholder="Provide a brief description of what was covered"
                  rows={3}
                  readOnly={!!recordOfWork && !isSubmitting}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resources">Resources</Label>
                  <Textarea 
                    id="resources" 
                    name="resources"
                    value={recordOfWork ? recordOfWork.resources : formValues.resources} 
                    onChange={handleInputChange}
                    placeholder="List any resources used or shared"
                    rows={3}
                    readOnly={!!recordOfWork && !isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment">Assignment</Label>
                  <Textarea 
                    id="assignment" 
                    name="assignment"
                    value={recordOfWork ? recordOfWork.assignment : formValues.assignment} 
                    onChange={handleInputChange}
                    placeholder="Any homework or assignments given"
                    rows={3}
                    readOnly={!!recordOfWork && !isSubmitting}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes"
                  value={recordOfWork ? recordOfWork.notes : formValues.notes} 
                  onChange={handleInputChange}
                  placeholder="Any additional notes or comments"
                  rows={2}
                  readOnly={!!recordOfWork && !isSubmitting}
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            
            {recordOfWork && !isSubmitting && (
              <div className="text-xs text-muted-foreground mt-2">
                <p>Created: {format(parseISO(recordOfWork.createdAt), "dd MMM yyyy HH:mm")}</p>
                {recordOfWork.updatedAt !== recordOfWork.createdAt && (
                  <p>Last updated: {format(parseISO(recordOfWork.updatedAt), "dd MMM yyyy HH:mm")}</p>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {recordOfWork && !isSubmitting ? "Close" : "Cancel"}
              </Button>
              {(!recordOfWork || isSubmitting) && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Record"
                  )}
                </Button>
              )}
              {recordOfWork && !isSubmitting && (
                <Button 
                  onClick={() => {
                    setFormValues({
                      topic: recordOfWork.topic,
                      subtopics: recordOfWork.subtopics,
                      description: recordOfWork.description,
                      resources: recordOfWork.resources,
                      assignment: recordOfWork.assignment,
                      notes: recordOfWork.notes
                    });
                    setRecordOfWork(null);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Record
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}