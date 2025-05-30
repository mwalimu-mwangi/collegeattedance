import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  Layers,
  School,
  ArrowRight
} from "lucide-react";

export default function SuperAdminDashboard() {
  // Fetch essential data only - reduce number of simultaneous queries
  const { data: departments = [], isLoading: depLoading } = useQuery({ queryKey: ['/api/departments'] });
  const { data: courses = [], isLoading: coursesLoading } = useQuery({ queryKey: ['/api/courses'] });
  const { data: classes = [], isLoading: classesLoading } = useQuery({ queryKey: ['/api/classes'] });
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ['/api/users'] });
  const { data: terms = [], isLoading: termsLoading } = useQuery({ queryKey: ['/api/academic-terms'] });
  
  // Load secondary data only when primary data is loaded
  const { data: sections = [] } = useQuery({ 
    queryKey: ['/api/sections'], 
    enabled: !depLoading 
  });
  const { data: levels = [] } = useQuery({ 
    queryKey: ['/api/levels'], 
    enabled: !depLoading 
  });
  const { data: units = [] } = useQuery({ 
    queryKey: ['/api/units'], 
    enabled: !coursesLoading 
  });

  const dashboardLoading = depLoading || coursesLoading || classesLoading || usersLoading || termsLoading;

  // Calculate user statistics by role
  const userStats = Array.isArray(users) ? users.reduce((acc: any, user: any) => {
    acc.total++;
    switch (user.role) {
      case 'admin':
      case 'super_admin':
        acc.admins++;
        break;
      case 'hod':
        acc.hods++;
        break;
      case 'teacher':
        acc.teachers++;
        break;
      case 'student':
        acc.students++;
        break;
    }
    return acc;
  }, { total: 0, admins: 0, hods: 0, teachers: 0, students: 0 }) : { total: 0, admins: 0, hods: 0, teachers: 0, students: 0 };

  if (dashboardLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Departments"
            value={Array.isArray(departments) ? departments.length : 0}
            description="Total academic departments"
            icon={<Building className="h-5 w-5 text-blue-600" />}
            linkHref="/departments"
            loading={isLoading}
          />
          <StatsCard
            title="Sections"
            value={Array.isArray(sections) ? sections.length : 0}
            description="Total departmental sections"
            icon={<Layers className="h-5 w-5 text-indigo-600" />}
            linkHref="/sections"
            loading={isLoading}
          />
          <StatsCard
            title="Levels"
            value={Array.isArray(levels) ? levels.length : 0}
            description="Academic levels configured"
            icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
            linkHref="/levels"
            loading={isLoading}
          />
          <StatsCard
            title="Courses"
            value={Array.isArray(courses) ? courses.length : 0}
            description="Active academic courses"
            icon={<School className="h-5 w-5 text-violet-600" />}
            linkHref="/courses"
            loading={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Units"
            value={Array.isArray(units) ? units.length : 0}
            description="Total teaching units"
            icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
            linkHref="/units"
            loading={isLoading}
          />
          <StatsCard
            title="Classes"
            value={Array.isArray(classes) ? classes.length : 0}
            description="Active student classes"
            icon={<Calendar className="h-5 w-5 text-green-600" />}
            linkHref="/classes"
            loading={isLoading}
          />
          <StatsCard
            title="Users"
            value={userStats.total}
            description="Total system users"
            icon={<Users className="h-5 w-5 text-amber-600" />}
            linkHref="/users"
            loading={isLoading}
          />
          <StatsCard
            title="Terms"
            value={Array.isArray(terms) ? terms.length : 0}
            description="Academic terms configured"
            icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
            linkHref="/academic-terms"
            loading={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                Breakdown of system users by role
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-5 w-24 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-5 w-16 animate-pulse rounded bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <UserRoleStat role="Admin" count={userStats.admins} total={userStats.total} color="blue" />
                  <UserRoleStat role="HOD" count={userStats.hods} total={userStats.total} color="purple" />
                  <UserRoleStat role="Teacher" count={userStats.teachers} total={userStats.total} color="green" />
                  <UserRoleStat role="Student" count={userStats.students} total={userStats.total} color="amber" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="/users">
                  <span className="flex items-center justify-center">
                    View All Users
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* System Alerts */}
          <Card id="alerts">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Items that require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-200"></div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                  No alerts found. All systems are running smoothly.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <span className="flex items-center justify-center">
                  Resolve All Alerts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Quick Actions */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <QuickActionButton
                  icon={<Building className="h-5 w-5" />}
                  label="Add Department"
                  href="/departments"
                />
                <QuickActionButton
                  icon={<Users className="h-5 w-5" />}
                  label="Create User"
                  href="/users/new"
                />
                <QuickActionButton
                  icon={<School className="h-5 w-5" />}
                  label="Add Course"
                  href="/courses"
                />
                <QuickActionButton
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Add Unit"
                  href="/units"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon,
  linkHref,
  loading = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 w-16 animate-pulse rounded bg-slate-200"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Link href={linkHref} className="text-xs text-blue-600 hover:underline">
          View details →
        </Link>
      </CardFooter>
    </Card>
  );
}

// User Role Stat Component
function UserRoleStat({
  role,
  count,
  total,
  color,
}: {
  role: string;
  count: number;
  total: number;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const percentage = Math.round((count / total) * 100) || 0;
  
  const colorClasses = {
    blue: "bg-blue-100",
    purple: "bg-purple-100",
    green: "bg-green-100",
    amber: "bg-amber-100",
  };
  
  const barColorClasses = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-sm font-medium">{role}</span>
        <span className="text-sm text-slate-500">
          {count} ({percentage}%)
        </span>
      </div>
      <div className={`h-2 w-full overflow-hidden rounded-full ${colorClasses[color]}`}>
        <div
          className={`h-full rounded-full ${barColorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Button variant="outline" asChild className="h-24 w-full flex-col justify-center">
      <Link href={href}>
        <div className="mb-2">{icon}</div>
        <span>{label}</span>
      </Link>
    </Button>
  );
}