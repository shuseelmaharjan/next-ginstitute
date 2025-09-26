"use client"

import { Settings, Mail, MessageCircle, ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import Link from "next/link";

interface User { name: string; email: string; avatar: string; role?: string }

interface OtherNavSubItem { title: string; url: string }
interface OtherNavItem {
  title: string;
  url: string;
  icon: any; // lucide-react icon component
  items?: OtherNavSubItem[];
  defaultOpen?: boolean;
}

// Mail & Messages collapsible menus placed BEFORE Settings per request.
const otherNavItems: OtherNavItem[] = [
  // {
  //   title: "Mail",
  //   url: "/mail",
  //   icon: Mail,
  //   items: [
  //     { title: "Compose", url: "/mail/compose" },
  //     { title: "Inbox", url: "/mail/inbox" },
  //     { title: "Sent", url: "/mail/sent" },
  //   ],
  // },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageCircle,
    items: [
      { title: "Send Message", url: "/messages/send" },
      { title: "Inbox", url: "/messages/inbox" },
      { title: "History", url: "/messages/history" },
    ],
  },
  {
    title: "Settings",
    url: "/settings/profile", // Keep settings last as requested
    icon: Settings,
  },
];

export function NavOthers({ user }: { user: User }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Others</SidebarGroupLabel>
      <SidebarMenu>
        {otherNavItems.map(item => {
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
            );
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
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
