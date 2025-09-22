"use client"

import { ChevronRight, SquareTerminal, Bot, BookOpen, Settings2, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

// User interface for role-based access
interface User {
  name: string
  email: string
  avatar: string
  role?: string
}

// Navigation item interfaces for better type safety
interface NavigationSubItem {
  title: string
  url: string
}
interface NavigationItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: NavigationSubItem[]
}

// Static navigation data
const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquareTerminal,
    isActive: true,
    items: [
      { title: "Overview", url: "/dashboard/overview" },
      { title: "Analytics", url: "/dashboard/analytics" },
      { title: "Reports", url: "/dashboard/reports" },
    ],
  },
  {
    title: "Courses",
    url: "/courses",
    icon: Bot,
    items: [
      { title: "All Courses", url: "/courses/all" },
      { title: "My Courses", url: "/courses/my-courses" },
      { title: "Categories", url: "/courses/categories" },
    ],
  },
  {
    title: "Students",
    url: "/students",
    icon: BookOpen,
    items: [
      { title: "All Students", url: "/students/all" },
      { title: "Enrollments", url: "/students/enrollments" },
      { title: "Performance", url: "/students/performance" },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      { title: "General", url: "/settings/general" },
      { title: "Profile", url: "/settings/profile" },
      { title: "Security", url: "/settings/security" },
    ],
  },
];

// Filter navigation items based on user role
const getFilteredNavItems = (userRole?: string): NavigationItem[] => {
  if (userRole === "admin") {
    return navigationItems; // Admin sees all
  } else if (userRole === "faculty") {
    return navigationItems.filter(item =>
      ["Dashboard", "Courses", "Students"].includes(item.title)
    );
  } else {
    return navigationItems.filter(item =>
      ["Dashboard", "Courses"].includes(item.title)
    );
  }
};

export function NavMain({ user }: { user: User }) {
  const filteredItems = getFilteredNavItems(user.role);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Main</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          // Special handling for Dashboard - render as direct link without collapsible
          if (item.title === "Dashboard") {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Render other items as collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.items && item.items.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}