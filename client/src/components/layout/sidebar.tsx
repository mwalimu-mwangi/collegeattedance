import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  School, 
  PanelsTopLeft, 
  Users, 
  Wallet, 
  Settings, 
  Sigma,
  Component,
  SquareMenu,
  PersonStanding,
  BadgeCheck,
  Newspaper,
  CalendarX,
  FolderClosed,
  Calendar,
  GraduationCap,
  BookOpen,
  ClipboardList
} from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavLink = ({ href, icon, label, active }: NavLinkProps) => (
  <Link href={href}>
    <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      active 
        ? "bg-primary-100 text-primary-800 border-r-2 border-primary-800" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`}>
      {icon}
      <span className="ml-3">{label}</span>
    </a>
  </Link>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!user) return null;

  return (
    <aside 
      className={`w-64 bg-white shadow-md fixed inset-y-0 left-0 z-30 lg:relative lg:translate-x-0 transform transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
        <div className="flex items-center">
          <School className="text-primary-800 mr-2" />
          <h1 className="text-lg font-semibold text-primary-800">CAS</h1>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-700">
          <FolderClosed size={20} />
        </button>
      </div>
      
      <div className="py-4 px-4">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
            <PersonStanding size={16} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        
        {/* Super Admin Navigation */}
        {user.role === 'super_admin' && (
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={<PanelsTopLeft size={18} />} label="Dashboard" active={location === '/dashboard'} />
            <NavLink href="/users" icon={<Users size={18} />} label="User Management" active={location === '/users'} />
            <NavLink href="/departments" icon={<Wallet size={18} />} label="Departments" active={location === '/departments'} />
            <NavLink href="/sections" icon={<Component size={18} />} label="Sections" active={location === '/sections'} />
            <NavLink href="/levels" icon={<GraduationCap size={18} />} label="Levels" active={location === '/levels'} />
            <NavLink href="/courses" icon={<SquareMenu size={18} />} label="Courses" active={location === '/courses'} />
            <NavLink href="/classes" icon={<School size={18} />} label="Classes" active={location === '/classes'} />
            <NavLink href="/academic-terms" icon={<Calendar size={18} />} label="Academic Terms" active={location === '/academic-terms'} />
            <NavLink href="/units" icon={<BookOpen size={18} />} label="Units" active={location === '/units'} />
            <NavLink href="/sessions" icon={<CalendarX size={18} />} label="Sessions" active={location === '/sessions'} />
            <NavLink href="/attendance" icon={<BadgeCheck size={18} />} label="Attendance" active={location === '/attendance'} />
            <NavLink href="/record-work" icon={<Newspaper size={18} />} label="Record of Work" active={location === '/record-work'} />
            <NavLink href="/reports" icon={<Sigma size={18} />} label="Reports" active={location === '/reports'} />
            <NavLink href="/settings" icon={<Settings size={18} />} label="System Settings" active={location === '/settings'} />
          </div>
        )}
        
        {/* Admin Navigation */}
        {user.role === 'admin' && (
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={<PanelsTopLeft size={18} />} label="Dashboard" active={location === '/dashboard'} />
            <NavLink href="/departments" icon={<Wallet size={18} />} label="Departments" active={location === '/departments'} />
            <NavLink href="/sections" icon={<Component size={18} />} label="Sections" active={location === '/sections'} />
            <NavLink href="/levels" icon={<GraduationCap size={18} />} label="Levels" active={location === '/levels'} />
            <NavLink href="/courses" icon={<SquareMenu size={18} />} label="Courses" active={location === '/courses'} />
            <NavLink href="/classes" icon={<School size={18} />} label="Classes" active={location === '/classes'} />
            <NavLink href="/academic-terms" icon={<Calendar size={18} />} label="Academic Terms" active={location === '/academic-terms'} />
            <NavLink href="/units" icon={<BookOpen size={18} />} label="Units" active={location === '/units'} />
            <NavLink href="/sessions" icon={<CalendarX size={18} />} label="Sessions" active={location === '/sessions'} />
            <NavLink href="/teachers" icon={<PersonStanding size={18} />} label="Teachers" active={location === '/teachers'} />
            <NavLink href="/students" icon={<Users size={18} />} label="Students" active={location === '/students'} />
            <NavLink href="/attendance" icon={<BadgeCheck size={18} />} label="Attendance" active={location === '/attendance'} />
            <NavLink href="/record-work" icon={<Newspaper size={18} />} label="Record of Work" active={location === '/record-work'} />
            <NavLink href="/reports" icon={<Sigma size={18} />} label="Reports" active={location === '/reports'} />
          </div>
        )}
        
        {/* HOD Navigation */}
        {user.role === 'hod' && (
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={<PanelsTopLeft size={18} />} label="Dashboard" active={location === '/dashboard'} />
            <NavLink href="/department-courses" icon={<SquareMenu size={18} />} label="Courses" active={location === '/department-courses'} />
            <NavLink href="/classes" icon={<School size={18} />} label="Classes" active={location === '/classes'} />
            <NavLink href="/department-teachers" icon={<PersonStanding size={18} />} label="Teachers" active={location === '/department-teachers'} />
            <NavLink href="/units" icon={<BookOpen size={18} />} label="Units" active={location === '/units'} />
            <NavLink href="/sessions" icon={<CalendarX size={18} />} label="Sessions" active={location === '/sessions'} />
            <NavLink href="/attendance" icon={<BadgeCheck size={18} />} label="Attendance" active={location === '/attendance'} />
            <NavLink href="/record-work" icon={<Newspaper size={18} />} label="Record of Work" active={location === '/record-work'} />
            <NavLink href="/reports" icon={<Sigma size={18} />} label="Reports" active={location === '/reports'} />
          </div>
        )}
        
        {/* Teacher Navigation */}
        {user.role === 'teacher' && (
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={<PanelsTopLeft size={18} />} label="Dashboard" active={location === '/dashboard'} />
            <NavLink href="/units" icon={<SquareMenu size={18} />} label="My Units" active={location === '/units'} />
            <NavLink href="/sessions" icon={<CalendarX size={18} />} label="Sessions" active={location === '/sessions'} />
            <NavLink href="/attendance" icon={<BadgeCheck size={18} />} label="Attendance" active={location === '/attendance'} />
            <NavLink href="/record-work" icon={<Newspaper size={18} />} label="Record of Work" active={location === '/record-work'} />
            <NavLink href="/reports" icon={<Sigma size={18} />} label="Reports" active={location === '/reports'} />
          </div>
        )}
        
        {/* Student Navigation */}
        {user.role === 'student' && (
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={<PanelsTopLeft size={18} />} label="Dashboard" active={location === '/dashboard'} />
            <NavLink href="/units" icon={<SquareMenu size={18} />} label="My Units" active={location === '/units'} />
            <NavLink href="/attendance" icon={<BadgeCheck size={18} />} label="My Attendance" active={location === '/attendance'} />
            <NavLink href="/schedule" icon={<CalendarX size={18} />} label="Schedule" active={location === '/schedule'} />
          </div>
        )}
      </div>
    </aside>
  );
}