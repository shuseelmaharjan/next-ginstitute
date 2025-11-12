"use client"

import * as React from "react"
import { memo, useMemo, useState, useEffect } from "react"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { NavOthers } from "./nav-others"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuthenticate } from "../context/AuthenticateContext"
import NavCourses from "./nav-courses"
import NavSite from "./nav-site"
import NavBilling from "./nav-billing"

interface SessionUserData {
  id: number
  username: string
  email: string
  name: string
  role: string
  isActive: boolean
  profilePicture?: string
}

// Function to generate initials from name
const generateInitials = (name: string): string => {
  if (!name) return "U";
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  if (words.length === 2) {
    return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
  }
  
  // For 3 or more words, take first letter of first 3 words
  return words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join("");
};

export const AppSidebar = memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading, error } = useAuthenticate();
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

  // Create user data object for NavUser component - memoized to prevent recreation
  const userData = useMemo(() => {
    // Use data from either AuthenticateContext or sessionStorage
    const currentUser = user || sessionUser;

    if (currentUser && currentUser.name && currentUser.email && currentUser.role) {
      const initials = generateInitials(currentUser.name);
      return {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="20" fill="#0962c6"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="14" font-weight="bold">
              ${initials}
            </text>
          </svg>
        `)}`,
      };
    }

    return {
      name: "Loading...",
      email: "",
      avatar: "",
      role: "Member",
    };
  }, [user, sessionUser]);

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher user={userData}/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain user={userData}/>
        <NavCourses user={userData}/>
        <NavSite user={userData}/>
        <NavBilling user={userData}/>
        <NavOthers user={userData}/>
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading user...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-red-500">Error: {error}</div>
          </div>
        ) : (
          <NavUser />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
});
