"use client"

// Updated icons: LayoutDashboard for Dashboard, Users for Users, GraduationCap for Classes
import { LayoutDashboard, Users, GraduationCap, ChevronRight } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import Link from "next/link"

// User interface for role-based access
interface User {
  name: string
  email: string
  avatar: string
  role?: string
}

// Minimal single-item nav
interface NavigationSubItem { title: string; url: string }
interface NavigationItem { title: string; url: string; icon: any; items?: NavigationSubItem[]; defaultOpen?: boolean }
const navigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    defaultOpen: false,
    items: [
      { title: "All Students", url: "/users/students" },
      { title: "New Admission", url: "/users/admission" },
      { title: "All Teachers", url: "/users/teachers" },
      { title: "Add Teacher", url: "/users/teachers/add-teacher" },
      { title: "All Staff", url: "/users/staffs" },
        { title: "Add Staff", url: "/users/staff/add-staff" },
        { title: "Pending Approvals", url: "/users/pending-approvals" },
    ],
  },
  {
    title: "Classroom",
    url: "/classroom",
    icon: GraduationCap,
    defaultOpen: false,
    items: [
      { title: "Classroom", url: "/classroom/all-classrooms" },
      { title: "Add Class", url: "/classroom/add-classroom" },
    ],
  }
];

export function NavMain({ user }: { user: User }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Main</SidebarGroupLabel>
      <SidebarMenu>
        {navigationItems.map(item => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
          return (
            <Collapsible key={item.title} asChild defaultOpen={item.defaultOpen} className="group/collapsible">
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
                      {item.items.map(sub => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={sub.url}>
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}