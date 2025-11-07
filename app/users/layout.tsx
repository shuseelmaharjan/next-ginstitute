"use client";

import AuthenticatedLayout from "../components/AuthenticatedLayout";
import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { toSentenceCase } from "@/utils/textUtils";

interface UserProps {
  children: React.ReactNode;
}

// Friendly title mapping for known segments under /users
const SEGMENT_TITLE_MAP: Record<string, string> = {
  "": "Users",
  users: "Users",
  admission: "Admission",
  students: "Students",
  "pending-approvals": "Pending approvals",
  "assign-engagements": "Assign engagements",
};

const formatSegmentTitle = (segment: string): string => {
  if (!segment) return "Users";
  // If we have a predefined title, use it
  if (SEGMENT_TITLE_MAP[segment]) return SEGMENT_TITLE_MAP[segment];
  // Otherwise, convert slug to readable (replace hyphens, decode, then sentence case)
  const readable = decodeURIComponent(segment.replace(/-/g, " "));
  return toSentenceCase(readable);
};

const UsersPageLayout = ({ children }: UserProps) => {
  const pathname = usePathname();

  // Build dynamic breadcrumb items from the current pathname
  const breadcrumbItems = useMemo(() => {
    // Ensure pathname starts with /users
    const path = pathname || "/users";
    const segments = path.split("/").filter(Boolean); // remove empty

    // If we're exactly at /users
    if (segments.length === 1 && segments[0] === "users") {
      return [{ title: "Users", isCurrentPage: true }];
    }

    // Build cumulative hrefs for each segment
    const items: Array<{ title: string; href?: string; isCurrentPage?: boolean }> = [];

    // Always start with root Users
    items.push({ title: "Users", href: "/users" });

    let cumulative = "/users";
    // Add remaining segments after 'users'
    const tail = segments.slice(1);
    tail.forEach((seg, index) => {
      cumulative += `/${seg}`;
      const isLast = index === tail.length - 1;

      // Default title
      let title = formatSegmentTitle(seg);

      // Special-case: under /users/students/[id], show "Student info" for the id segment
      const prevSeg = index > 0 ? tail[index - 1] : segments[0];
      if (prevSeg === "students" && index === 1) {
        title = "Student Info";
      }

      items.push(
        isLast
          ? { title, isCurrentPage: true }
          : { title, href: cumulative }
      );
    });

    return items;
  }, [pathname]);

  return (
    <AuthenticatedLayout breadcrumbItems={breadcrumbItems}>
      <div className="p-4">
        {children}
      </div>
    </AuthenticatedLayout>
  );
};

export default UsersPageLayout;
