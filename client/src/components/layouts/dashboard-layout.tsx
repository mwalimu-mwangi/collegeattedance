import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutGrid, 
  Users, 
  BookOpen, 
  Layers, 
  School, 
  BookCopy,
  Calendar, 
  UserCheck, 
  ClipboardList,
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const NavItem = ({ href, icon: Icon, label, isActive }: { 
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
}) => {
  const navigate = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  return (
    <div 
      onClick={navigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
    </div>
  );
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isHOD = user?.role === "hod";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">College Attendance</h1>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-3">
            <NavItem 
              href="/" 
              icon={LayoutGrid} 
              label="Dashboard" 
              isActive={location === "/"} 
            />
            
            {/* Admin and Super Admin links */}
            {isAdmin && (
              <>
                <Separator className="my-2" />
                <p className="px-3 text-xs font-medium text-muted-foreground py-1">
                  Administration
                </p>
                <NavItem 
                  href="/users" 
                  icon={Users} 
                  label="Users" 
                  isActive={location === "/users"} 
                />
                <NavItem 
                  href="/classes" 
                  icon={BookOpen} 
                  label="Classes" 
                  isActive={location === "/classes"} 
                />
                <NavItem 
                  href="/departments" 
                  icon={School} 
                  label="Departments" 
                  isActive={location === "/departments"} 
                />
                <NavItem 
                  href="/sections" 
                  icon={Layers} 
                  label="Sections" 
                  isActive={location === "/sections"} 
                />
                <NavItem 
                  href="/levels" 
                  icon={Layers} 
                  label="Levels" 
                  isActive={location === "/levels"} 
                />
                <NavItem 
                  href="/courses" 
                  icon={BookOpen} 
                  label="Courses" 
                  isActive={location === "/courses"} 
                />
                <NavItem 
                  href="/academic-terms" 
                  icon={Calendar} 
                  label="Academic Terms" 
                  isActive={location === "/academic-terms"} 
                />
              </>
            )}
            
            {/* HOD links */}
            {isHOD && (
              <>
                <Separator className="my-2" />
                <p className="px-3 text-xs font-medium text-muted-foreground py-1">
                  Department Management
                </p>
                <NavItem 
                  href="/department-courses" 
                  icon={BookOpen} 
                  label="Courses" 
                  isActive={location === "/department-courses"} 
                />
                <NavItem 
                  href="/classes" 
                  icon={School} 
                  label="Classes" 
                  isActive={location === "/classes"} 
                />
                <NavItem 
                  href="/department-teachers" 
                  icon={Users} 
                  label="Teachers" 
                  isActive={location === "/department-teachers"} 
                />
                <NavItem 
                  href="/assign-teachers" 
                  icon={User} 
                  label="Assign Teachers" 
                  isActive={location === "/assign-teachers"} 
                />
              </>
            )}
            
            {/* Teacher links */}
            {(isTeacher || isHOD || isAdmin) && (
              <>
                <Separator className="my-2" />
                <p className="px-3 text-xs font-medium text-muted-foreground py-1">
                  Teaching
                </p>
                <NavItem 
                  href="/units" 
                  icon={BookCopy} 
                  label="My Units" 
                  isActive={location === "/units"} 
                />
                <NavItem 
                  href="/unit-schedules" 
                  icon={Calendar} 
                  label="Weekly Schedules" 
                  isActive={location === "/unit-schedules"} 
                />
                <NavItem 
                  href="/class-sessions" 
                  icon={Calendar} 
                  label="Class Sessions" 
                  isActive={location === "/class-sessions"} 
                />
                <NavItem 
                  href="/attendance" 
                  icon={UserCheck} 
                  label="Attendance" 
                  isActive={location === "/attendance"} 
                />
                <NavItem 
                  href="/records" 
                  icon={ClipboardList} 
                  label="Records of Work" 
                  isActive={location === "/records"} 
                />
              </>
            )}
            
            {/* Student links */}
            {isStudent && (
              <>
                <Separator className="my-2" />
                <p className="px-3 text-xs font-medium text-muted-foreground py-1">
                  Student
                </p>
                <NavItem 
                  href="/my-courses" 
                  icon={BookOpen} 
                  label="My Courses" 
                  isActive={location === "/my-courses"} 
                />
                <NavItem 
                  href="/my-attendance" 
                  icon={UserCheck} 
                  label="My Attendance" 
                  isActive={location === "/my-attendance"} 
                />
              </>
            )}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {user ? getInitials(user.fullName) : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role.replace("_", " ")}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}