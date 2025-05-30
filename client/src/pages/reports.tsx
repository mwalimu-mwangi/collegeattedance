import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { FileDown, Calendar, FileText, BarChart as BarChartIcon } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportUnit, setReportUnit] = useState("all");
  const [reportFormat, setReportFormat] = useState("summary");
  
  // Mock data for UI demonstration
  // This would be replaced with real data from API
  const mockUnits = [
    { id: 1, name: "Database Management Systems" },
    { id: 2, name: "Web Development" },
    { id: 3, name: "Software Engineering Principles" },
    { id: 4, name: "Mobile Application Development" },
    { id: 5, name: "Computer Networks" }
  ];
  
  // Mock attendance data
  const attendanceData = [
    { name: 'Week 1', attendance: 92 },
    { name: 'Week 2', attendance: 88 },
    { name: 'Week 3', attendance: 85 },
    { name: 'Week 4', attendance: 90 },
    { name: 'Week 5', attendance: 82 },
    { name: 'Week 6', attendance: 78 },
    { name: 'Week 7', attendance: 84 },
    { name: 'Week 8', attendance: 87 }
  ];
  
  // Mock unit comparison data
  const unitComparisonData = [
    {
      name: 'Database Management',
      attendance: 89,
    },
    {
      name: 'Web Development',
      attendance: 92,
    },
    {
      name: 'Software Engineering',
      attendance: 78,
    },
    {
      name: 'Mobile Development',
      attendance: 86,
    },
    {
      name: 'Computer Networks',
      attendance: 90,
    },
  ];
  
  // Mock pie chart data for attendance distribution
  const attendanceDistributionData = [
    { name: 'Above 90%', value: 18, color: '#22c55e' },  // Green
    { name: '80-90%', value: 15, color: '#3b82f6' },     // Blue
    { name: '70-80%', value: 8, color: '#f59e0b' },      // Amber
    { name: 'Below 70%', value: 4, color: '#ef4444' }    // Red
  ];
  
  // Mock detailed attendance data
  const detailedAttendanceData = [
    {
      id: 1,
      unit: "Database Management Systems",
      date: new Date("2023-05-15"),
      time: "09:00 - 11:00",
      present: 40,
      total: 45,
      percentage: 89
    },
    {
      id: 2,
      unit: "Web Development",
      date: new Date("2023-05-14"),
      time: "11:15 - 13:15",
      present: 35,
      total: 38,
      percentage: 92
    },
    {
      id: 3,
      unit: "Software Engineering Principles",
      date: new Date("2023-05-12"),
      time: "14:00 - 16:00",
      present: 25,
      total: 32,
      percentage: 78
    },
    {
      id: 4,
      unit: "Mobile Application Development",
      date: new Date("2023-05-10"),
      time: "14:00 - 16:00",
      present: 24,
      total: 28,
      percentage: 86
    },
    {
      id: 5,
      unit: "Computer Networks",
      date: new Date("2023-05-10"),
      time: "09:00 - 11:00",
      present: 38,
      total: 42,
      percentage: 90
    }
  ];
  
  const handleExportReport = () => {
    // Export report functionality
    console.log(`Exporting ${activeTab} report in ${reportFormat} format for ${reportPeriod} period`);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Reports</h1>
        
        {/* Report Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-40">
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={reportUnit} onValueChange={setReportUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {mockUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-40">
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 ml-auto">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Calendar size={18} />
                </Button>
                
                <Button onClick={handleExportReport}>
                  <FileDown size={18} className="mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
            <TabsTrigger value="work">Record of Work Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Attendance Trend Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend</CardTitle>
                  <CardDescription>Weekly attendance rate for all units</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={attendanceData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attendance" name="Attendance Rate %" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Unit Comparison Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Unit Comparison</CardTitle>
                  <CardDescription>Average attendance rate by unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={unitComparisonData}
                        margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attendance" name="Attendance Rate %" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Attendance Distribution */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Student Attendance Distribution</CardTitle>
                <CardDescription>Number of students by attendance percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {attendanceDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedAttendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.unit}</TableCell>
                        <TableCell>{format(record.date, "MMM d, yyyy")}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.present}</TableCell>
                        <TableCell>{record.total}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.percentage >= 90 
                              ? "bg-green-100 text-green-800"
                              : record.percentage >= 80
                              ? "bg-blue-100 text-blue-800"
                              : record.percentage >= 70
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {record.percentage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-slate-500">
                  Showing {detailedAttendanceData.length} records
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mr-2">
                    Previous
                  </Button>
                  <Button size="sm">
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="work">
            <Card>
              <CardHeader>
                <CardTitle>Record of Work Summary</CardTitle>
                <CardDescription>Status of all teaching units and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Sessions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">42</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Completed Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">38</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Pending Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-amber-600">4</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit</TableHead>
                        <TableHead>Total Sessions</TableHead>
                        <TableHead>Completed Records</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Database Management Systems</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            100%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText size={16} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Web Development</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>9</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            90%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText size={16} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Software Engineering Principles</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>7</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            88%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText size={16} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Mobile Application Development</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>7</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            88%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText size={16} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Computer Networks</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>7</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            88%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText size={16} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <BarChartIcon size={16} className="mr-1" />
                  Generate Full Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
