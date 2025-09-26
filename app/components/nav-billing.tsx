"use client";

import Link from "next/link";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
// Added BarChart3 (analytics), FileText (report), Bell (notice)
import { CreditCard, Inbox, BarChart3, FileText, Bell } from "lucide-react";

interface User { name: string; email: string; avatar: string; role?: string }

interface SimpleNavItem { title: string; url: string; icon?: any }

// Added new items: Analytics, Report, Notice (assumption: plural route for notices; adjust as needed)
const billingItems: SimpleNavItem[] = [
	{ title: "Billing", url: "/billing", icon: CreditCard },
	{ title: "Requests", url: "/requests", icon: Inbox },
	{ title: "Analytics", url: "/analytics", icon: BarChart3 },
	{ title: "Report", url: "/report", icon: FileText },
	{ title: "Notice", url: "/notices", icon: Bell },
];

export function NavBilling({ user }: { user: User }) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="select-none">Billing & Requests</SidebarGroupLabel>
			<SidebarMenu>
				{billingItems.map(item => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton asChild tooltip={item.title}>
							<Link href={item.url}>
								{item.icon && <item.icon />}
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export default NavBilling;
