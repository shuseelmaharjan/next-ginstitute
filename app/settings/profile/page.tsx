"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthenticate } from "../../context/AuthenticateContext";
import { User, Camera, Save } from "lucide-react";
import { EditUserModal } from "./EditUserModal";
import { UploadProfilePictureModal } from "./UploadProfilePictureModal";
import { fetchFullUser } from "@/app/services/userService";
import { formatDate, toSentenceCase } from "@/app/utils/textUtils";
import config from "@/app/config";

export default function ProfilePage() {
  const { user } = useAuthenticate();
  const [fullUser, setFullUser] = useState<any | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoadingFull(true);
      try {
        const res = await fetchFullUser(user.id);
        if (res.success) {
          setFullUser(res.data);
        } else {
          setError(res.message || 'Failed to load user details');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingFull(false);
      }
    };
    load();
  }, [user?.id]);

  const refreshAfterUpdate = (updated: any) => {
    setFullUser(updated);
  };
  const refreshFullUser = async () => {
    if (user?.id) {
      const res = await fetchFullUser(user.id);
      if (res.success) setFullUser(res.data);
    }
  };

  const buildImageSrc = (path?: string | null) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
    const base = config.BASE_URL?.replace(/\/$/, "") || "";
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Profile Picture Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Profile Picture</h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={buildImageSrc(fullUser?.profilePicture)} alt="Profile picture"  className="object-cover"/>
              <AvatarFallback className="text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <UploadProfilePictureModal currentImage={fullUser?.profilePicture ? buildImageSrc(fullUser.profilePicture) : undefined} onUploaded={refreshFullUser} />
              <p className="text-xs text-muted-foreground">JPG or PNG. 5MB max.</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Full Information Display */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">User Information</h3>
              <p className="text-xs text-muted-foreground">Complete personal, guardian and address details</p>
            </div>
            <EditUserModal onUpdated={refreshAfterUpdate} />
          </div>
          {loadingFull && <p className="text-sm text-muted-foreground">Loading user details...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {fullUser && (
            <div className="space-y-8">
              {/* Personal */}
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Personal Information</h4>
                <Separator />
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="First Name" value={fullUser.firstName} />
                  <Info label="Middle Name" value={fullUser.middleName} />
                  <Info label="Last Name" value={fullUser.lastName} />
                  <Info label="Email" value={fullUser.email} />
                  <Info label="Date of Birth" value={formatDate(fullUser.dateOfBirth)} />
                  <Info label="Sex" value={toSentenceCase(fullUser.sex)} />
                </div>
              </div>
              {/* Guardian */}
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Guardian / Family Details</h4>
                <Separator />
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="Father Name" value={fullUser.fatherName} />
                  <Info label="Mother Name" value={fullUser.motherName} />
                  <Info label="Grandfather Name" value={fullUser.grandfatherName} />
                  <Info label="Grandmother Name" value={fullUser.grandmotherName} />
                  <Info label="Guardian Name" value={fullUser.guardianName} />
                  <Info label="Guardian Contact" value={fullUser.guardianContact} />
                  <Info label="Father Number" value={fullUser.fatherNumber} />
                  <Info label="Mother Number" value={fullUser.motherNumber} />
                  <Info label="Emergency Contact" value={fullUser.emergencyContact} />
                </div>
              </div>
              {/* Address */}
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">Address Information</h4>
                <Separator />
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="Country" value={fullUser.country} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Permanent Address</h5>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Info label="Province" value={fullUser.permanentState} />
                    <Info label="District" value={fullUser.permanentCity} />
                    <Info label="Metropolitician City / Municipality / Rural Municipality" value={fullUser.permanentLocalGovernment} />
                    <Info label="Ward" value={fullUser.permanentWardNumber} />
                    <Info label="Tole" value={fullUser.permanentTole} />
                    <Info label="Postal Code" value={fullUser.permanentPostalCode} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Temporary Address</h5>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Info label="Province" value={fullUser.tempState} />
                    <Info label="District" value={fullUser.tempCity} />
                    <Info label="Metropolitician City / Municipality / Rural Municipality" value={fullUser.tempLocalGovernment} />
                    <Info label="Ward" value={fullUser.tempWardNumber} />
                    <Info label="Tole" value={fullUser.tempTole} />
                    <Info label="Postal Code" value={fullUser.tempPostalCode} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Account Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Account Status</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Account Status</span>
              </div>
              {fullUser?.isActive ? (
                <p className="text-sm text-green-600">Active</p>
              ) : (
                <p className="text-sm text-red-600">Inactive</p>
              )}
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Member Since</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {fullUser ? formatDate(fullUser.createdAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold break-words min-h-[1.25rem]">{value || '—'}</p>
    </div>
  );
}