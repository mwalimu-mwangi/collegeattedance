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
  Building,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  School,
  Clock
} from "lucide-react";

export default function SuperAdminDashboard() {
  // Load only essential data to prevent crashes
  const { data: departments = [] } = useQuery({ queryKey: ['/api/departments'] });
  const { data: courses = [] } = useQuery({ queryKey: ['/api/courses'] });
  const { data: classes = [] } = useQuery({ queryKey: ['/api/classes'] });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'] });
  const { data: terms = [] } = useQuery({ queryKey: ['/api/academic-terms'] });

  // Simple calculations
  const activeTerms = Array.isArray(terms) ? terms.filter((term: any) => term.isActive).length : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <Button asChild>
            <Link href="/departments">
              Manage Academic Structure
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(departments) ? departments.length : 0}</div>
              <p className="text-xs text-muted-foreground">Total academic departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <School className="h-5 w-5 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(courses) ? courses.length : 0}</div>
              <p className="text-xs text-muted-foreground">Active academic courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <Calendar className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(classes) ? classes.length : 0}</div>
              <p className="text-xs text-muted-foreground">Active student classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total system users</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Manage Structure</CardTitle>
              <CardDescription>Configure academic hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/departments">
                  <Building className="mr-2 h-4 w-4" />
                  Departments
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/courses">
                  <School className="mr-2 h-4 w-4" />
                  Courses
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Management</CardTitle>
              <CardDescription>Classes and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/classes">
                  <Calendar className="mr-2 h-4 w-4" />
                  Classes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/academic-terms">
                  <Clock className="mr-2 h-4 w-4" />
                  Academic Terms
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Term</CardTitle>
              <CardDescription>Active academic period</CardDescription>
            </CardHeader>
            <CardContent>
              {activeTerms > 0 ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeTerms}</div>
                  <p className="text-sm text-muted-foreground">Active term(s)</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <p className="text-sm text-muted-foreground">No active terms</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Your attendance management system is operational
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{Array.isArray(departments) ? departments.length : 0}</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{Array.isArray(courses) ? courses.length : 0}</div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{Array.isArray(classes) ? classes.length : 0}</div>
                <div className="text-sm text-muted-foreground">Classes</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{totalUsers}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}