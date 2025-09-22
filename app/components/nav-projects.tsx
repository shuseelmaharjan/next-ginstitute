"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

// User interface for role-based access
interface User {
  name: string
  email: string
  avatar: string
  role?: string
}

// Static projects data
const projectsData = [
  {
    name: "Course Management",
    url: "/projects/course-management",
    icon: GraduationCap,
    roles: ["superadmin", "faculty"]
  },
  {
    name: "Student Portal",
    url: "/projects/student-portal",
    icon: Users,
    roles: ["superadmin", "faculty", "student"]
  },
  {
    name: "Academic Calendar",
    url: "/projects/academic-calendar",
    icon: Calendar,
    roles: ["superadmin", "faculty"]
  },
  {
    name: "Learning Resources",
    url: "/projects/learning-resources",
    icon: BookOpen,
    roles: ["superadmin", "faculty", "student"]
  },
  {
    name: "Analytics Dashboard",
    url: "/projects/analytics",
    icon: BarChart3,
    roles: ["superadmin"]
  },
  {
    name: "System Settings",
    url: "/projects/system-settings",
    icon: Settings,
    roles: ["superadmin"]
  },
];

// Filter projects based on user role
const getFilteredProjects = (userRole?: string) => {
  if (!userRole) userRole = "student"; // Default to student if no role
  
  return projectsData.filter(project => 
    project.roles.includes(userRole!)
  );
};

export function NavProjects({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()
  const filteredProjects = getFilteredProjects(user.role);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {filteredProjects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
