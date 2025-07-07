'use client'

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
import { CircleUser, Home, LogIn, Menu, Package2, Settings, BarChart3, LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { signOut, useSession } from "next-auth/react"
import { AddJobButton } from "../dashboard/add-job-button"
import Link from "next/link"
import { toast } from "sonner"
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
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      {/* FIXED: Add logo and name for desktop view */}
      <Link href="/" className="hidden lg:flex items-center gap-2 font-semibold text-foreground">
        <Package2 className="h-6 w-6 text-primary" />
        <span className="">JobTracker Pro</span>
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 lg:hidden" aria-label="Toggle navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1" />

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
            <Button variant="secondary" size="icon" className="rounded-full" aria-label="Toggle user menu">
              <CircleUser className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{session?.user?.name || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/stats" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" /> Statistics
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}