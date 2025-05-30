import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Clock, BookOpen, BarChart3, User, School, GraduationCap } from "lucide-react";
import { Unit, Course } from "@shared/schema";

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Fetch teacher's assigned units directly
  const { data: teacherUnits = [], isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/teacher", user?.id, "units"],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/teacher/${user.id}/units`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch units");
      return res.json();
    },
    enabled: !!user?.id
  });
  
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  // Get course information for the units
  const unitsWithCourseInfo = teacherUnits.map(unit => {
    const course = courses.find(c => c.id === unit.courseId);
    return {
      ...unit,
      courseName: course?.name || 'Unknown Course',
      courseCode: course?.code || 'N/A'
    };
  });

  if (unitsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.fullName}</h1>
            <p className="text-muted-foreground">
              Your teaching dashboard and assigned units
            </p>
          </div>
          <Button asChild>
            <Link href="/units">
              <BookOpen className="mr-2 h-4 w-4" />
              View All Units
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assigned Units</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherUnits.length}</div>
              <p className="text-xs text-muted-foreground">Units you teach</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sessions today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sessions this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Average attendance</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Units */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Your Assigned Units
            </CardTitle>
            <CardDescription>
              Units you are currently teaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unitsWithCourseInfo.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Unit Code</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitsWithCourseInfo.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.code}</TableCell>
                      <TableCell>{unit.courseName}</TableCell>
                      <TableCell>{unit.courseCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/units/${unit.id}/sessions`}>
                              <Calendar className="mr-1 h-3 w-3" />
                              Sessions
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/attendance">
                              <User className="mr-1 h-3 w-3" />
                              Attendance
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Assigned</h3>
                <p className="text-gray-500 mb-4">
                  You haven't been assigned any units yet. Contact your administrator to get units assigned.
                </p>
                <Button asChild variant="outline">
                  <Link href="/units">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse All Units
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Tools</CardTitle>
              <CardDescription>
                Access your teaching resources and tools
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col justify-center">
                <Link href="/sessions">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="text-xs">Manage Sessions</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col justify-center">
                <Link href="/attendance">
                  <User className="h-6 w-6 mb-2" />
                  <span className="text-xs">Mark Attendance</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col justify-center">
                <Link href="/record-work">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span className="text-xs">Record Work</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col justify-center">
                <Link href="/reports">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-xs">View Reports</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent teaching activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 mb-2" />
                <p>No recent activity</p>
                <p className="text-sm">Start teaching to see your activity here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}