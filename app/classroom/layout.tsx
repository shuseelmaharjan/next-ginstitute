"use client";

import AuthenticatedLayout from "../components/AuthenticatedLayout";
import React, {memo, useMemo} from "react";
import {usePathname} from "next/navigation";

interface UserProps {
    children: React.ReactNode;
}

const getPageTitle = (pathname: string): string => {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    switch (lastSegment) {
        case 'all-classrooms':
            return 'All Classrooms';
        case 'add-classroom':
            return 'Add Classroom';
        default:
            return 'Classroom';
    }
};

const ClassroomLayout = memo(function ClassroomLayout({children}: UserProps) {
    const pathname = usePathname();
    const pageTitle = getPageTitle(pathname);

    // Memoize breadcrumb items to prevent recreation on every render
    const breadcrumbItems = useMemo(() =>
        pathname === '/classroom'
            ? [{title: "Classroom", isCurrentPage: true}]
            : [
                {title: "Classroom", href: "/classroom"},
                {title: pageTitle, isCurrentPage: true}
            ],
        [pathname, pageTitle]
    );

    return (
        <AuthenticatedLayout breadcrumbItems={breadcrumbItems}>
            <div className="p-4">
                {children}
            </div>
        </AuthenticatedLayout>
    );
});

export default ClassroomLayout;
