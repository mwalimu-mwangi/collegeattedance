import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import BasicAuthPage from "@/pages/basic-auth";
import Dashboard from "@/pages/dashboard";
import ReportsPage from "@/pages/reports-page";
import AttendanceReportsPage from "@/pages/attendance-reports";
import DepartmentsPage from "@/pages/departments";
import SectionsPage from "@/pages/sections";
import LevelsPage from "@/pages/levels";
import CoursesPage from "@/pages/courses-new";
import UnitsPage from "@/pages/units-page-new";
import UnitSessionsPage from "@/pages/unit-sessions-new";
import AttendancePage from "@/pages/attendance";
import RecordWorkPage from "@/pages/record-work";
import AssignTeachersPage from "@/pages/assign-teachers";
import UserManagement from "@/pages/user-management";
import MarkAttendancePage from "@/pages/mark-attendance";
import AcademicTermsPage from "@/pages/academic-terms";
import UnitSchedulesPage from "@/pages/unit-schedules";
import ClassesPage from "@/pages/classes";
import UsersPage from "@/pages/users";
import StudentsPage from "@/pages/students";
import StudentsManagement from "@/pages/students-management";
import StudentAttendancePage from "@/pages/student-attendance";
import TeacherAttendancePage from "@/pages/teacher-attendance";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { ModalProvider } from "@/context/modal-context";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={BasicAuthPage} />
      
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/departments" component={DepartmentsPage} />
      <ProtectedRoute path="/sections" component={SectionsPage} />
      <ProtectedRoute path="/levels" component={LevelsPage} />
      <ProtectedRoute path="/courses" component={CoursesPage} />
      <ProtectedRoute path="/classes" component={ClassesPage} />
      <ProtectedRoute path="/units" component={UnitsPage} />
      <ProtectedRoute path="/sessions" component={UnitSessionsPage} />
      <ProtectedRoute path="/class-sessions" component={UnitSessionsPage} />
      <ProtectedRoute path="/attendance" component={AttendancePage} />
      <ProtectedRoute path="/record-work" component={RecordWorkPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/attendance-reports" component={AttendanceReportsPage} />
      <ProtectedRoute path="/assign-teachers" component={AssignTeachersPage} />
      <ProtectedRoute path="/mark-attendance" component={MarkAttendancePage} />
      <ProtectedRoute path="/academic-terms" component={AcademicTermsPage} />
      <ProtectedRoute path="/unit-schedules" component={UnitSchedulesPage} />
      <ProtectedRoute path="/users" component={UserManagement} allowedRoles={["admin", "super_admin"]} />
      <ProtectedRoute path="/students" component={StudentsPage} allowedRoles={["admin", "super_admin", "hod"]} />
      <ProtectedRoute path="/students-management" component={StudentsManagement} allowedRoles={["admin", "super_admin", "hod"]} />
      <ProtectedRoute path="/teacher-attendance" component={TeacherAttendancePage} allowedRoles={["teacher", "hod", "admin", "super_admin"]} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
