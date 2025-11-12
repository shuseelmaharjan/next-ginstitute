"use client"

import config from "@/app/config"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import apiHandler from "@/app/api/apiHandler";
import { useRouter } from "next/navigation";
import { useAuthenticate } from "@/app/context/AuthenticateContext";
import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"

interface SessionUserData {
  id: number
  username: string
  email: string
  name: string
  role: string
  isActive: boolean
  profilePicture?: string
}

function buildImageSrc(path?: string | null) {
  if (!path) return ""
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:")) return path
  const base = config.BASE_URL?.replace(/\/$/, "") || ""
  return `${base}${path.startsWith('/') ? path : '/' + path}`
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { clearAuth, user } = useAuthenticate();
  const [sessionUser, setSessionUser] = useState<SessionUserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Get user data from sessionStorage after component mounts
  useEffect(() => {
    setIsMounted(true);
    const getUserFromSession = () => {
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) return null;
        const parsedUser = JSON.parse(userData);
        return (parsedUser && typeof parsedUser === 'object') ? parsedUser : null;
      } catch (error) {
        console.error("Failed to parse user data:", error);
        return null;
      }
    };
    setSessionUser(getUserFromSession());
  }, []);

  // Use data from either AuthenticateContext or sessionStorage
  const currentUser = user || sessionUser;
  const name = currentUser?.name || 'User'
  const email = currentUser?.email || ''
  const avatarSrc = currentUser?.profilePicture ? buildImageSrc(currentUser.profilePicture) : ''

  const initials = useMemo(() => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U'
  }, [name])

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiHandler({ url: '/api/auth/logout', method: 'POST', data: {} });
    } catch { /* ignore */ } finally {
      clearAuth();
      // Clear sessionStorage data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('session');
      }
      router.push('/login');
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  // Don't render if not mounted yet to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer select-none"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={name}  className="object-cover h-full w-full"/>}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={name} className="object-cover h-full w-full"/>}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href="/settings/profile" className="flex items-center w-full gap-2 outline-none focus-visible:ring-0">
                <BadgeCheck />
                Account
                </Link>
                
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center w-full gap-2 rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be signed out and redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut} className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500">
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
