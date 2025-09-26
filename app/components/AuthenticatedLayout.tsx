"use client";

import React, { memo } from "react";
import { AppSidebar } from "../components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import PrivateRoute from "../context/PrivateRoute";
import Link from "next/link";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
}

const AuthenticatedLayout = memo(function AuthenticatedLayout({ 
  children, 
  breadcrumbItems = []
}: AuthenticatedLayoutProps) {
  return (
    <PrivateRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {item.isCurrentPage ? (
                          <BreadcrumbPage>{item.title}</BreadcrumbPage>
                        ) : (
                          <Link href={item.href || "#"}>
                            {item.title}
                          </Link>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbItems.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PrivateRoute>
  );
});

export default AuthenticatedLayout;