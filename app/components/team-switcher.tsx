"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { toSentenceCase } from '../../utils/textUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { FaArrowLeft } from "react-icons/fa6"
import Link from "next/link"
import Image from "next/image"

export function TeamSwitcher({
  user
}: {
  user: {
    name: string
    email: string
    avatar: string
    role?: string
  }
}) {
  const { isMobile } = useSidebar()

  if (!user) {
    return null
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image src="/images/main.png" alt="GFI Logo" width={20} height={20} className="h-5 w-5"/>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {process.env.NEXT_PUBLIC_COMPANY_NAME || "Your Company"}
                </span>
                <span className="truncate text-xs">{toSentenceCase(user.role || "Member")}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
              </DropdownMenuItem>
            ))} */}

            <DropdownMenuItem
                className="p-2 cursor-pointer select-none hover:bg-gray-100 flex items-center gap-2"
              >
                <Link href="/" className="flex items-center gap-2 w-full">
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <FaArrowLeft className="size-4 shrink-0" />
                  </div>
                  Back to Main Site
                </Link>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
