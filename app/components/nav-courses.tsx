"use client";

import { ChevronRight, BookOpen, Boxes, HelpCircle, ClipboardList } from "lucide-react";
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

interface CourseSubItem { title: string; url: string }
interface CourseNavItem {
	title: string;
	url: string;
	icon: any;
	items?: CourseSubItem[];
	defaultOpen?: boolean;
}

const courseNavItems: CourseNavItem[] = [
	{
		title: "Courses",
		url: "/courses",
		icon: BookOpen,
		defaultOpen: false,
		items: [
			{ title: "All Courses", url: "/courses/all" },
			{ title: "Add Courses", url: "/courses/add" },
		],
	},
	{
		title: "Models",
		url: "/questions-models",
		icon: Boxes,
		defaultOpen: false,
		items: [
			{ title: "Models", url: "/questions/models" },
			{ title: "Add Model", url: "/questions/add" },
		],
	},
    {
		title: "Questions",
		url: "/questions",
		icon: HelpCircle,
		defaultOpen: false,
		items: [
			{ title: "All Questions", url: "/questions/all" },
			{ title: "Add Question", url: "/questions/add" },
		],
	},
     {
		title: "Exams",
		url: "/exams",
		icon: ClipboardList,
		defaultOpen: false,
		items: [
			{ title: "All Exams", url: "/exams/all" },
			{ title: "Schedule Exam", url: "/exams/schedule" },
			{ title: "Take Exam", url: "/exams/take" },
			{ title: "Exam History", url: "/exams/history" },
		],
	}
];

export function NavCourses({ user }: { user: User }) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="select-none">Courses</SidebarGroupLabel>
			<SidebarMenu>
				{courseNavItems.map(section => (
					<Collapsible key={section.title} asChild defaultOpen={section.defaultOpen} className="group/collapsible">
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={section.title}>
									<section.icon />
									<span>{section.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							{section.items && section.items.length > 0 && (
								<CollapsibleContent>
									<SidebarMenuSub>
										{section.items.map(item => (
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
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export default NavCourses;
