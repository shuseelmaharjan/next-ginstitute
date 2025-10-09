"use client";

import { ChevronRight, Globe } from "lucide-react";
import Link from "next/link";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
} from "@/components/ui/sidebar";

interface User { name: string; email: string; avatar: string; role?: string }

interface SiteSubItem { title: string; url: string }
interface SiteNavItem {
	title: string;
	url: string;
	icon: any;
	items?: SiteSubItem[];
	defaultOpen?: boolean;
}

const siteNav: SiteNavItem = {
	title: "Site",
	url: "/site",
	icon: Globe,
	defaultOpen: false,
	items: [
		{ title: "Banners", url: "/site/banners" },
		{ title: "Testimonials", url: "/site/testimonials" },
		{ title: "About Us", url: "/site/about" },
        {title: "Principal Message", url: "/site/principal"},
		{ title: "Ads", url: "/site/ads" },
		{ title: "Downloads", url: "/site/downloads" },
		{ title: "Gallery", url: "/site/gallery" },
		{ title: "Career", url: "/site/career" },
	],
};

export function NavSite({ user }: { user: User }) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="select-none">Site Settings</SidebarGroupLabel>
			<SidebarMenu>
				<Collapsible asChild defaultOpen={siteNav.defaultOpen} className="group/collapsible">
					<SidebarMenuItem>
						<CollapsibleTrigger asChild>
							<SidebarMenuButton tooltip={siteNav.title}>
								<siteNav.icon />
								<span>{siteNav.title}</span>
								<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
							</SidebarMenuButton>
						</CollapsibleTrigger>
						{siteNav.items && siteNav.items.length > 0 && (
							<CollapsibleContent>
								<SidebarMenuSub>
									{siteNav.items.map(item => (
										<SidebarMenuSubItem key={item.title}>
											<SidebarMenuSubButton asChild>
												<Link href={item.url}>
													<span>{item.title}</span>
												</Link>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						)}
					</SidebarMenuItem>
				</Collapsible>
			</SidebarMenu>
		</SidebarGroup>
	);
}

export default NavSite;
