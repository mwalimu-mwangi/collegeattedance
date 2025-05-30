import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
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
  Layers,
  ArrowRight
} from "lucide-react";
import { Department, Section, Course, Unit, Class, AcademicTerm } from "@shared/schema";

export default function HODDashboard() {
  const { user } = useAuth();
  
  // Only fetch essential data to improve performance
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ['/api/departments'] });
  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['/api/courses'] });
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['/api/classes'] });
  const { data: terms = [] } = useQuery<AcademicTerm[]>({ queryKey: ['/api/academic-terms'] });

  // Get HOD's department - for now use first department as fallback
  const hodDepartment = departments.find((dept) => dept.id === user?.departmentId) || departments[0];
  
  // Filter data for HOD's department
  const departmentCourses = courses.filter((course) => course.departmentId === hodDepartment?.id);
  const departmentClasses = classes.filter((classItem) => classItem.departmentId === hodDepartment?.id);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HOD Dashboard</h1>
            <p className="text-muted-foreground">
              {hodDepartment ? `Managing ${hodDepartment.name}` : 'Department Management Overview'}
            </p>
          </div>
          <Button asChild>
            <Link href="/courses">
              Manage Department Courses
            </Link>
          </Button>
        </div>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              {hodDepartment?.name || 'Your Department'}
            </CardTitle>
            <CardDescription>
              Overview of your department's academic structure and activities
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Department Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Courses"
            value={departmentCourses.length}
            description="Active courses offered"
            icon={<School className="h-5 w-5 text-violet-600" />}
            linkHref="/courses"
          />
          <StatsCard
            title="Classes"
            value={departmentClasses.length}
            description="Active student classes"
            icon={<Calendar className="h-5 w-5 text-green-600" />}
            linkHref="/classes"
          />
          <StatsCard
            title="Terms"
            value={terms.filter(term => term.isActive).length}
            description="Active academic terms"
            icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
            linkHref="/academic-terms"
          />
        </div>

        {/* Recent Activities and Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Classes</CardTitle>
              <CardDescription>
                Latest student classes in your department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentClasses.length > 0 ? (
                <div className="space-y-3">
                  {departmentClasses.slice(0, 3).map((classItem: any) => (
                    <div key={classItem.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-muted-foreground">{classItem.code}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {classItem.currentStudents || 0} students
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No classes found for your department
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/classes">
                    <span className="flex items-center justify-center">
                      View All Classes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for department management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                  icon={<School className="h-5 w-5" />}
                  label="Add Course"
                  href="/courses"
                />
                <QuickActionButton
                  icon={<Layers className="h-5 w-5" />}
                  label="View Sections"
                  href="/sections"
                />
                <QuickActionButton
                  icon={<Calendar className="h-5 w-5" />}
                  label="View Classes"
                  href="/classes"
                />
                <QuickActionButton
                  icon={<Users className="h-5 w-5" />}
                  label="Academic Terms"
                  href="/academic-terms"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Academic Term */}
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Term</CardTitle>
            <CardDescription>
              Active term and schedule information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(terms) && terms.length > 0 ? (
              <div className="space-y-2">
                {terms.filter((term: any) => term.isActive).map((term: any) => (
                  <div key={term.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{term.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Start Date:</span> {new Date(term.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">End Date:</span> {new Date(term.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {term.weekCount} weeks
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> <span className="text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No active academic term found
              </div>
            )}
          </CardContent>
        </Card>
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
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2">
          <Link href={linkHref} className="text-xs text-blue-600 hover:underline">
            View details →
          </Link>
        </div>
      </CardContent>
    </Card>
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
    <Button variant="outline" asChild className="h-20 w-full flex-col justify-center">
      <Link href={href}>
        <div className="mb-2">{icon}</div>
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}