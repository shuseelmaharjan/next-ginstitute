"use client";

import { Settings, User, Shield, Key } from "lucide-react";
import { memo, useMemo } from "react";
import Cookies from "js-cookie";

const SettingsPage = memo(function SettingsPage() {
  const getRole = Cookies.get('_ud');
  let role: string | undefined;

  const decryptData = (data: string) => {
    try {
      return JSON.parse(atob(data));
    } catch (e) {
      console.error("Failed to decrypt data", e);
      return null;
    }
  };
  if (getRole) {
    const userData = decryptData(getRole);
    role = userData?.role;
  }

  // Memoize the role check to prevent recalculation on every render
  const isFacultyAdmin = useMemo(() => 
    role === 'superadmin' || role === 'admin', 
    [role]
  );

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings Overview</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-6 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage your personal information and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-6 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Account Security</h3>
              <p className="text-sm text-muted-foreground">
                Password, two-factor authentication, and login settings
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isFacultyAdmin && (
            <>
              <div className="flex items-center gap-3 p-6 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Faculty Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Faculty-related settings and permissions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-6 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">API Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    API keys, webhooks, and integration settings
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h4 className="font-semibold mb-2">Quick Access</h4>
        <p className="text-sm text-muted-foreground">
          Select a settings category from the sidebar to configure specific options,
          or use the navigation menu to quickly jump to different sections.
        </p>
      </div>
    </div>
  );
});

export default SettingsPage;