import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, 
  Info, 
  ChevronRight, 
  PersonStanding,
  ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  // Generate breadcrumbs based on current location
  const generateBreadcrumbs = () => {
    const path = location.split('/').filter(segment => segment);
    
    if (path.length === 0) {
      return [{ label: 'Dashboard', href: '/dashboard' }];
    }
    
    return [
      { label: 'Home', href: '/dashboard' },
      ...path.map((segment, index) => {
        const href = `/${path.slice(0, index + 1).join('/')}`;
        // Capitalize and replace hyphens with spaces
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, href };
      })
    ];
  };
  
  const breadcrumbs = generateBreadcrumbs();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button onClick={onOpenSidebar} className="text-slate-500 lg:hidden mr-2">
            <Menu size={20} />
          </button>
          <nav className="hidden md:flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="text-slate-400 mx-1" size={14} />
                  )}
                  <Link href={crumb.href}>
                    <a className="text-slate-500 hover:text-slate-700">
                      {crumb.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-slate-500 hover:text-slate-700 relative">
            <Info size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full"></span>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-sm focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
                  <PersonStanding size={16} />
                </div>
                <span className="hidden md:block ml-2 text-sm font-medium">
                  {user.fullName}
                </span>
                <ChevronDown className="text-slate-400 ml-1" size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <a className="cursor-pointer w-full">Your Profile</a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <a className="cursor-pointer w-full">Settings</a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
