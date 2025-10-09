"use client";

import AuthenticatedLayout from "../components/AuthenticatedLayout";
import React from "react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface UserProps {
  children: React.ReactNode;
}

const getPageTitle = (pathname: string): string => {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];

  switch (lastSegment) {
    case 'all-users':
      return 'All Users';
    case 'admission':
      return 'Create new student';
    default:
      return 'Users';
  }
};

const UsersPageLayout = ({ children }: UserProps) => {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  // Memoize breadcrumb items to prevent recreation on every render
  const breadcrumbItems = useMemo(() =>
    pathname === '/users'
      ? [{ title: "Users", isCurrentPage: true }]
      : [
        { title: "Users", href: "/users" },
        { title: pageTitle, isCurrentPage: true }
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
};

export default UsersPageLayout;

