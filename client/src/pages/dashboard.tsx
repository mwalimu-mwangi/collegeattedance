import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import TeacherDashboard from "./role-dashboards/simple-teacher-dashboard";
import StudentDashboard from "./role-dashboards/student-dashboard";
import SuperAdminDashboard from "./role-dashboards/simple-super-admin-dashboard";
import HODDashboard from "./role-dashboards/hod-dashboard";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      // Based on user role, decide where to go
      switch (user.role) {
        case 'teacher':
          // Teacher stays on dashboard
          break;
        case 'student':
          // Student stays on dashboard
          break;
        case 'super_admin':
        case 'admin':
        case 'hod':
          // Admin users see the admin dashboard
          break;
        default:
          // Unknown role, redirect to auth
          setRedirectUrl('/auth');
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (redirectUrl) {
    return <Redirect to={redirectUrl} />;
  }

  // If the user is logged in, show the appropriate dashboard based on role
  if (user) {
    switch (user.role) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'super_admin':
      case 'admin':
        return <SuperAdminDashboard />;
      case 'hod':
        return <HODDashboard />;
      default:
        // Unknown role, show a default dashboard with restricted access
        return (
          <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
              <h2 className="text-2xl font-semibold">Welcome, {user.fullName}</h2>
              <p className="text-muted-foreground">
                Your role ({user.role}) doesn't have a specific dashboard yet.
              </p>
            </div>
          </DashboardLayout>
        );
    }
  }

  // If we get here, the user is not logged in
  return <Redirect to="/auth" />;
}