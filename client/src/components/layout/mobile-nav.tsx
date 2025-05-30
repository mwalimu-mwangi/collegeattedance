import { useLocation, Link } from "wouter";
import { PanelsTopLeft, SquareMenu, BadgeCheck, Newspaper, PersonStanding } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 lg:hidden z-30">
      <NavItem 
        href="/dashboard" 
        icon={<PanelsTopLeft size={20} />} 
        label="PanelsTopLeft" 
        isActive={location === '/dashboard'} 
      />
      <NavItem 
        href="/units" 
        icon={<SquareMenu size={20} />} 
        label="Units" 
        isActive={location === '/units'} 
      />
      <NavItem 
        href="/attendance" 
        icon={<BadgeCheck size={20} />} 
        label="Attendance" 
        isActive={location === '/attendance'} 
      />
      <NavItem 
        href="/record-work" 
        icon={<Newspaper size={20} />} 
        label="Record" 
        isActive={location === '/record-work'} 
      />
      <NavItem 
        href="/profile" 
        icon={<PersonStanding size={20} />} 
        label="Profile" 
        isActive={location === '/profile'} 
      />
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center justify-center p-2 ${
        isActive ? 'text-primary-800' : 'text-slate-600'
      }`}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
}
