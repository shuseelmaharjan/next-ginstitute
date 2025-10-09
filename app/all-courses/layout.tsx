"use client";

import AuthenticatedLayout from "@/app/components/AuthenticatedLayout";
import React, {memo} from "react";
import {usePathname} from "next/navigation";

interface UserProps {
    children: React.ReactNode;
}

const getPageTitle = (pathname: string): string => {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    switch (lastSegment) {
        case 'all-courses':
            return 'All Courses';
        default:
            return 'Courses';
    }
};

const AllCoursesLayout = memo(function AllCoursesLayout({children}: UserProps) {
    const pathname = usePathname();
    const pageTitle = getPageTitle(pathname);

    const breadcrumbItems = pathname === '/all-courses'
        ? [{title: "All Courses", isCurrentPage: true}]
        : [
            {title: "All Courses", href: "/all-courses"},
            {title: pageTitle, isCurrentPage: true}
        ];

    return (
        <AuthenticatedLayout breadcrumbItems={breadcrumbItems}>
            <div className="p-4">
                {children}
            </div>
        </AuthenticatedLayout>
    );
});

export default AllCoursesLayout;