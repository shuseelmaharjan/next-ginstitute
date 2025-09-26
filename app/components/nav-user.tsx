"use client"

import Cookies from "js-cookie"
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
import React, { useMemo, useState } from "react"
import Link from "next/link"

interface CookieUserData {
  name?: string
  email?: string
  role?: string
  profilePicture?: string
  [k: string]: any
}

const decryptData = (data: string) => {
  try {
    return JSON.parse(atob(data))
  } catch (e) {
    console.error("Failed to decrypt data", e)
    return null
  }
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
  const { clearAuth } = useAuthenticate();

  const cookieUser: CookieUserData | null = useMemo(() => {
    const raw = Cookies.get('_ud')
    if (!raw) return null
    return decryptData(raw)
  }, [])

  const name = cookieUser?.name || 'User'
  const email = cookieUser?.email || ''
  const avatarSrc = cookieUser?.profilePicture ? buildImageSrc(cookieUser.profilePicture) : ''
  const initials = useMemo(() => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U'
  }, [name])

  const [isLoggingOut,setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiHandler({ url: '/api/auth/logout', method: 'POST', data: {} });
    } catch (e) { /* ignore */ } finally {
      clearAuth();
      router.push('/login');
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

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
