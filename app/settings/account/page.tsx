"use client";

import React, { useState, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, Smartphone, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { SessionInfo } from "@/app/services/accountService";
import AccountService from "@/app/services/accountService"; // adjust export to default (will modify service file next if needed)
import SessionService from "../../services/sessionService"; // use relative path to avoid alias resolution issue
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Cookies from "js-cookie";
import { decrypt } from "@/app/utils/crypto";
import apiHandler from "@/app/api/apiHandler";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AccountPage = function AccountPage() {
  // Token retrieval handled inside apiHandler now; context only for user/auth state
  const accountService = React.useMemo(() => new AccountService(), []);
  const sessionService = React.useMemo(() => new SessionService(), []);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState({
    changePassword: false,
    loadingSessions: false,
    revokeSession: false,
    revokeAllSessions: false,
    deleteAccount: false,
  });

  const router = useRouter();

  // Delete account modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmUsernameInput, setConfirmUsernameInput] = useState("");
  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (deleteOpen) {
      try {
        const enc = Cookies.get("_ud");
        if (enc) {
          const parsed = JSON.parse(atob(enc)); // legacy simple base64 fallback
          // If encrypted with AES helper in future, attempt decrypt
          if (parsed?.username) {
            setStoredUsername(parsed.username);
          } else {
            // attempt decrypt if encoded differently
            try {
              const maybe = decrypt(enc);
              const obj = JSON.parse(maybe);
              setStoredUsername(obj.username || null);
            } catch {
              setStoredUsername(null);
            }
          }
        }
      } catch {
        setStoredUsername(null);
      }
    } else {
      setConfirmUsernameInput("");
      setDeleteError(null);
    }
  }, [deleteOpen]);

  const clearAllAuth = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      // Remove all cookies (limited to known ones)
      ["accessToken", "refreshToken", "session", "_ud"].forEach(c => Cookies.remove(c));
    } catch (e) {
      console.warn("Error clearing auth state", e);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!storedUsername) {
      setDeleteError("Unable to resolve current username. Try reloading page.");
      return;
    }
    if (confirmUsernameInput.trim() !== storedUsername) {
      setDeleteError("Username does not match.");
      return;
    }
    try {
      setLoading(prev => ({ ...prev, deleteAccount: true }));
      const response = await apiHandler<{ success: boolean; message: string }>({
        url: "/api/v1/deactivate-account",
        method: "PUT",
        data: {},
      });
      if ((response as any).success) {
        toast({
          title: "Account Deactivated",
          description: (response as any).message || "Your account has been deactivated.",
          variant: "success",
        });
        clearAllAuth();
        router.replace("/login");
      } else {
        setDeleteError((response as any).message || "Failed to deactivate account");
      }
    } catch (error: any) {
      setDeleteError(error?.message || "Failed to deactivate account");
    } finally {
      setLoading(prev => ({ ...prev, deleteAccount: false }));
    }
  };

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
    loadCurrentSession();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(prev => ({ ...prev, loadingSessions: true }));
      const response = await sessionService.getActiveSessions();
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, loadingSessions: false }));
    }
  };

  const loadCurrentSession = async () => {
    try {
      const response = await sessionService.getCurrentSession();
      if (response.success && response.data) {
        setCurrentSession(response.data);
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, changePassword: true }));
      const response = await accountService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Password changed successfully",
          variant: "success"
        });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, changePassword: false }));
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setLoading(prev => ({ ...prev, revokeSession: true }));
      const response = await sessionService.logoutSession(sessionId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Session revoked successfully",
          variant: "success"
        });
        // Reload sessions
        await loadSessions();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to revoke session",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Revoke session error:', error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, revokeSession: false }));
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setLoading(prev => ({ ...prev, revokeAllSessions: true }));
      const response = await sessionService.logoutAllOtherSessions();
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "All other sessions revoked successfully",
          variant: "success"
        });
        // Reload sessions
        await loadSessions();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to revoke sessions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      toast({
        title: "Error",
        description: "Failed to revoke sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, revokeAllSessions: false }));
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // TODO: Implement 2FA toggle
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Security</h2>
        <p className="text-muted-foreground">
          Manage your account security settings and login preferences
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h3 className="text-lg font-medium">Change Password</h3>
          </div>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={loading.changePassword} className="cursor-pointer select-none">
              {loading.changePassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Two-Factor Authentication */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
          </div>
          <div className="max-w-md space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled ? "Enabled" : "Not enabled"}
                  </p>
                </div>
              </div>
              <Button 
                variant={twoFactorEnabled ? "destructive" : "default"}
                onClick={handleTwoFactorToggle}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account
            </p>
          </div>
        </div>

        <Separator />

        {/* Session Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Sessions</h3>
          <div className="space-y-3">
            {loading.loadingSessions ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading sessions...</span>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">No active sessions found</p>
              </div>
            ) : (
              <>
                {/* Current Session */}
                {currentSession && (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">
                          {currentSession.deviceInfo} • {currentSession.browserInfo} • 
                          Last active: {formatLastActivity(currentSession.lastActivity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other Sessions */}
                {sessions.filter(session => session.sessionId !== currentSession?.sessionId).map((session) => (
                  <div key={session.sessionId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.deviceInfo}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.browserInfo} • {session.platform} • 
                          Last active: {formatLastActivity(session.lastActivity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {session.ipAddress}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRevokeSession(session.sessionId)}
                        disabled={loading.revokeSession}
                      >
                        {loading.revokeSession ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Revoke"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <Button 
            variant="outline"
            onClick={handleRevokeAllSessions}
            disabled={loading.revokeAllSessions || sessions.length <= 1}
          >
            {loading.revokeAllSessions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              "Revoke All Other Sessions"
            )}
          </Button>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-medium">Danger Zone</h3>
          </div>
          <div className="p-4 border border-destructive/20 rounded-lg">
            <div className="space-y-3">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="cursor-pointer select-none">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                  </Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deactivation</DialogTitle>
            <DialogDescription>
              This action will deactivate your account. To confirm, type your username below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-username">Username</Label>
              <Input
                id="confirm-username"
                placeholder="Enter your username"
                value={confirmUsernameInput}
                onChange={(e) => setConfirmUsernameInput(e.target.value)}
                disabled={loading.deleteAccount}
              />
              {storedUsername && (
                <p className="text-xs text-muted-foreground mt-1">Current user: <span className="font-medium">{storedUsername}</span></p>
              )}
              {deleteError && <p className="text-xs text-red-500 mt-1">{deleteError}</p>}
            </div>
            <p className="text-sm text-destructive/80">
              Deactivation will log you out immediately. You may need admin intervention to reactivate.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading.deleteAccount}
              className="cursor-pointer select-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading.deleteAccount || !confirmUsernameInput}
              className="cursor-pointer select-none"
            >
              {loading.deleteAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deactivating...
                </>
              ) : (
                "Confirm Deactivate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountPage;