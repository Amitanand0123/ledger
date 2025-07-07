import Link from "next/link"
import { BarChart3, Home, Package2, Settings } from "lucide-react"
import { NavLink } from "./nav-link" // We will create a helper component for active links

export function Sidebar() {
  return (
    <div className="hidden border-r bg-background lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Package2 className="h-6 w-6 text-brand-primary" />
            <span className="">JobTracker Pro</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
            {/* Using a NavLink component to handle active state styling */}
            <NavLink href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink href="/stats">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </NavLink>
            <NavLink href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  )
}