import { useEffect, useState } from "react";
import { Book, Users, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BasicDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Mock data for UI demonstration
  const statsData = {
    totalUnits: 5,
    totalStudents: 148,
    todaySessions: 3,
    attendanceRate: 89
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">College Attendance System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.fullName}</span>
            <Button variant="outline" size="sm" onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/auth";
            }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Book className="h-6 w-6" />}
            title="Total Units"
            value={statsData.totalUnits}
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          
          <StatCard 
            icon={<Users className="h-6 w-6" />}
            title="Total Students"
            value={statsData.totalStudents}
            bgColor="bg-green-50"
            textColor="text-green-600"
          />
          
          <StatCard 
            icon={<Calendar className="h-6 w-6" />}
            title="Today's Sessions"
            value={statsData.todaySessions}
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
          
          <StatCard 
            icon={<CheckSquare className="h-6 w-6" />}
            title="Attendance Rate"
            value={`${statsData.attendanceRate}%`}
            bgColor="bg-amber-50"
            textColor="text-amber-600"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">Welcome to the College Attendance System</h3>
          <p className="text-slate-600 mb-4">
            This system helps manage attendance tracking across departments, courses, and units.
            As a {user?.role.replace('_', ' ')}, you have access to various features to help manage academic records.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Create Department</Button>
            <Button variant="outline">Manage Users</Button>
            <Button variant="outline">View Reports</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Getting Started</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Set up departments and academic structure</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Create user accounts for staff and students</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Configure courses and assign teachers to units</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Schedule sessions and track attendance</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">System Overview</h3>
            <p className="text-slate-600 mb-4">
              The College Attendance System provides comprehensive tools for managing the academic structure and tracking attendance:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start">
                <ArrowRightIcon className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Departments</strong>: Organize your institution by departments</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Sections & Levels</strong>: Manage academic hierarchy</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Courses & Units</strong>: Track specific academic offerings</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Attendance</strong>: Record and monitor student presence</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, bgColor, textColor }: { 
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-center mb-4">
        <div className={`${bgColor} ${textColor} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}