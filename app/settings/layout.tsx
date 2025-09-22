"use client";

import { usePathname } from "next/navigation";
import { SettingsSidebar } from "../components/SettingsSidebar";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import { memo, useMemo } from "react";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const getSettingsPageTitle = (pathname: string): string => {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  
  switch (lastSegment) {
    case 'settings':
      return 'Settings';
    case 'profile':
      return 'Profile';
    case 'account':
      return 'Account';
    case 'faculty':
      return 'Faculty';
    case 'api':
      return 'API';
    default:
      return 'Settings';
  }
};

const SettingsLayout = memo(function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const pageTitle = getSettingsPageTitle(pathname);
  
  // Memoize breadcrumb items to prevent recreation on every render
  const breadcrumbItems = useMemo(() => 
    pathname === '/settings' 
      ? [{ title: "Settings", isCurrentPage: true }]
      : [
          { title: "Settings", href: "/settings" },
          { title: pageTitle, isCurrentPage: true }
        ], 
    [pathname, pageTitle]
  );

  return (
    <AuthenticatedLayout breadcrumbItems={breadcrumbItems} >
      <div className="flex gap-6 h-full mt-4">
        <div className="sticky top-20 self-start flex-shrink-0">
          <SettingsSidebar className="flex-shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-background rounded-lg border p-6 min-h-[calc(100vh-12rem)]">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
});

export default SettingsLayout;