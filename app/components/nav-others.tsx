"use client"

import {
  Settings,
} from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
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
    name: "Settings",
    url: "/settings",
    icon: Settings,
  },
];


export function NavOthers({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="select-none">Others</SidebarGroupLabel>
      <SidebarMenu>
        {projectsData.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url} className="absolute inset-0" aria-label={item.name}>
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
