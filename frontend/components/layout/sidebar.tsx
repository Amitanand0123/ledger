import { BarChart3, Home, Settings } from 'lucide-react';
import { NavLink } from './nav-link';

export function Sidebar() {
  // This component is now just a block of navigation links,
  // perfect for the mobile menu. All structural divs and the header are removed.
  return (
    <nav className="grid gap-2 text-lg font-medium p-4">
        <NavLink href="/dashboard">
            <Home className="h-5 w-5" />
            Dashboard
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