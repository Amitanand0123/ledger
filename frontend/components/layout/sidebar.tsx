import { BarChart3, Calendar, Home, Settings } from 'lucide-react';
import { NavLink } from './nav-link';

export function Sidebar() {
  return (
    <nav className="grid gap-2 text-lg font-medium p-4">
        <NavLink href="/dashboard">
            <Home className="h-5 w-5" />
            Dashboard
        </NavLink>
        <NavLink href="/upcoming">
            <Calendar className="h-5 w-5" />
            Upcoming
        </NavLink>
        <NavLink href="/stats">
            <BarChart3 className="h-5 w-5" />
            Statistics
        </NavLink>
        <NavLink href="/settings">
            <Settings className="h-5 w-5" />
            Settings
        </NavLink>
    </nav>
  );
}