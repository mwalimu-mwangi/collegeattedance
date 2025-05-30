import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  LogOut,
  Menu,
  School,
  Settings,
  User,
  Users,
  BookOpen,
  GraduationCap,
  Home,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Role } from "@shared/schema";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: ReactNode;
  roles: Role[];
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    // Get user data
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
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

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    fetchUser();

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Navigation items with role-based access
  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher", "student"],
    },
    {
      title: "Departments",
      href: "/departments",
      icon: <Building size={20} />,
      roles: ["super_admin", "admin"],
    },
    {
      title: "Sections",
      href: "/sections",
      icon: <Layers size={20} />,
      roles: ["super_admin", "admin", "hod"],
    },
    {
      title: "Levels",
      href: "/levels",
      icon: <GraduationCap size={20} />,
      roles: ["super_admin", "admin", "hod"],
    },
    {
      title: "Courses",
      href: "/courses",
      icon: <School size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher"],
    },
    {
      title: "Classes",
      href: "/classes",
      icon: <Users size={20} />,
      roles: ["super_admin", "admin", "hod"],
    },

    {
      title: "Academic Terms",
      href: "/academic-terms",
      icon: <Calendar size={20} />,
      roles: ["super_admin", "admin"],
    },
    {
      title: "Units",
      href: "/units",
      icon: <BookOpen size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher"],
    },
    {
      title: "Sessions",
      href: "/sessions",
      icon: <Calendar size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher", "student"],
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: <ClipboardList size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher", "student"],
    },
    {
      title: "Teacher Attendance",
      href: "/teacher-attendance",
      icon: <UserCheck size={20} />,
      roles: ["teacher", "hod", "admin", "super_admin"],
    },
    {
      title: "Record of Work",
      href: "/record-work",
      icon: <FileText size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher"],
    },
    {
      title: "Students",
      href: "/students-management",
      icon: <GraduationCap size={20} />,
      roles: ["super_admin", "admin", "hod"],
    },
    {
      title: "Users",
      href: "/users",
      icon: <Users size={20} />,
      roles: ["super_admin", "admin"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings size={20} />,
      roles: ["super_admin", "admin", "hod", "teacher", "student"],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = user
    ? navigationItems.filter((item) => item.roles.includes(user.role as Role))
    : [];

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return "U";

    const nameParts = user.fullName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile navigation overlay */}
      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-white border-r shadow-sm transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          isMobile && (showMobileMenu ? "left-0" : "-left-full"),
        )}
      >
        {/* Logo and collapse button */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <div className="flex items-center">
              <School className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold">CAS</span>
            </div>
          )}
          {collapsed && <School className="h-6 w-6 text-primary" />}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <span className={collapsed ? "mx-0" : "mr-3"}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.title}</span>}
                </a>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* User profile */}
        <div
          className={cn(
            "mt-auto border-t p-4",
            collapsed ? "flex justify-center" : "",
          )}
        >
          {collapsed ? (
            <Avatar className="h-10 w-10 cursor-pointer" onClick={handleLogout}>
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
              {user?.profileImage && (
                <AvatarImage src={user.profileImage} alt={user.fullName} />
              )}
            </Avatar>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  {user?.profileImage && (
                    <AvatarImage src={user.profileImage} alt={user.fullName} />
                  )}
                </Avatar>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{user?.fullName}</span>
                  <span className="text-xs text-slate-500">
                    {formatRole(user?.role)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          "relative",
        )}
      >
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold">College Attendance System</h1>
            <div className="flex items-center gap-4">
              {isMobile && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  {user?.profileImage && (
                    <AvatarImage src={user.profileImage} alt={user.fullName} />
                  )}
                </Avatar>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
