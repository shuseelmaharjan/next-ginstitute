"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  User, 
  Settings, 
  Users, 
  Key,
  Menu,
    Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { memo, useMemo, useState, useEffect } from "react";

interface SettingsNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const allNavItems: SettingsNavItem[] = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your personal information and preferences"
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: Settings,
    description: "Account security, password, and login settings"
  },
  {
    title: "Faculty",
    href: "/settings/faculty",
    icon: Users,
    description: "Manage faculty-related settings and permissions"
  },
    {
    title: "Configure Fee Structure",
    href: "/settings/configure-fee-structure",
    icon: Banknote,
    description: "Set up and manage fee structures for courses"
    },
    {
    title: "Organization",
    href: "/settings/organization",
    icon: Users,
    description: "Organization details, website, and branding settings"
    },
  {
    title: "API",
    href: "/settings/api",
    icon: Key,
    description: "API keys, webhooks, and integration settings"
  },

];

// settingsNavItems will be determined inside the component after role is set

interface SettingsSidebarProps {
  className?: string;
}

export const SettingsSidebar = memo(function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get user role from session storage
    const userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setRole(userData?.role);
      } catch (e) {
        console.error("Failed to parse user data from session storage", e);
      }
    }
  }, []);

  // Determine settingsNavItems based on role
  const settingsNavItems: SettingsNavItem[] = 
    (role === "superadmin" || role === "admin")
      ? allNavItems
      : allNavItems.filter(item => 
          item.title === "Profile" || item.title === "Account"
        );

  // Memoize the sidebar content to prevent recreation
  const SidebarContent = useMemo(() => () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent group",
                    isActive 
                      ? "bg-accent text-accent-foreground border-none bg-primary/10" 
                      : "text-muted-foreground hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mt-0.5 flex-shrink-0",
                    isActive ? "text-primary" : "group-hover:text-foreground"
                  )} />
                  <div className="flex-1 space-y-1">
                    <div className={cn(
                      "font-medium leading-none",
                      isActive ? "text-foreground" : "group-hover:text-foreground"
                    )}>
                      {item.title}
                    </div>
                    <div className={cn(
                      "text-xs leading-tight",
                      isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  ), [pathname, settingsNavItems]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block lg:w-80 border bg-background rounded-lg max-h-[calc(100vh-8rem)] overflow-y-auto", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="mb-4">
              <Menu className="h-4 w-4 mr-2" />
              Settings Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
});
