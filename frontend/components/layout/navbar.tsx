'use client'

import Link from "next/link"
import {
  CircleUser,
  Home,
  Menu,
  Package2,
  Settings,
  BarChart3,
  LogIn,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"

import { AddJobButton } from "../dashboard/add-job-button"
import { ThemeToggle } from "./theme-toggle"
import { NavLink } from "./nav-link"
import { Sidebar } from "./sidebar"

export function Navbar() {
  const { data: session, status } = useSession();
  const isGuest = status === 'unauthenticated';

  const handleLogout = () => {
    toast("Are you sure you want to log out?", {
        action: {
            label: "Logout",
            onClick: () => signOut({ callbackUrl: '/' }),
        },
        cancel: {
            label: "Cancel",
            onClick: () => toast.dismiss(),
        }
    })
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {/* Logo on the left */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6 text-brand-primary" />
          <span className="sr-only">Ledger</span>
        </Link>
        {/* Centered Navigation Links */}
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/stats">Statistics</NavLink>
        <NavLink href="/settings">Settings</NavLink>
      </nav>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
           {/* The Sidebar component now cleanly provides the mobile navigation */}
           <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Right-side action buttons */}
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <AddJobButton />
        <ThemeToggle />
        {isGuest ? (
          <Button variant="outline" asChild>
              <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4"/> Login
              </Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session?.user?.name || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/settings" className="cursor-pointer">Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/stats" className="cursor-pointer">Statistics</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}