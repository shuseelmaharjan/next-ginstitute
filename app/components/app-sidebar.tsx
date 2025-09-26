"use client"

import * as React from "react"
import { useState, useEffect, memo, useMemo } from "react"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
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
import { useAccessToken } from "../context/AccessTokenContext"
import Cookies from "js-cookie"

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
  const { user, loading, error } = useAccessToken();

  const encryptedData = Cookies.get("_ud");

  const decryptData = (data: string) => {
    try {
      return JSON.parse(atob(data));
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      return null;
    }
  };

  // Create user data object for NavUser component - memoized to prevent recreation
  const userData = useMemo(() => {
    let profile = null;
    if (encryptedData) {
      profile = decryptData(encryptedData);
    }

    if (profile && profile.name && profile.email && profile.role) {
      const initials = generateInitials(profile.name);
      return {
        name: profile.name,
        email: profile.email,
        role: profile.role,
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

    if (user) {
      const initials = generateInitials(user.name);
      return {
        name: user.name,
        email: user.email,
        role: user.role,
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
  }, [encryptedData, user]);
  

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher user={userData}/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain user={userData}/>
        <NavProjects user={userData}/>
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
          <NavUser user={userData} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
});
