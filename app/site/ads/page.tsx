"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import apiHandler from "@/app/api/apiHandler";
import { toast } from "@/components/hooks/use-toast";
import {formatDate} from "@/utils/formatDate";

interface AdRecord {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdByUser?: { id: number; fullName: string } | null;
  updatedByUser?: { id: number; fullName: string } | null;
}

export default function AdPage() {
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedAd, setSelectedAd] = useState<AdRecord | null>(null);

  // form state (used for both create & edit)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // helper to safely extract message from unknown error (avoid `any`)
  const getErrorMessage = (err: unknown, fallback = "An error occurred") => {
    if (err && typeof err === "object" && "message" in err) {
      const maybe = err as { message?: unknown };
      return typeof maybe.message === "string" ? maybe.message : String(maybe.message ?? fallback);
    }
    return fallback;
  };

  useEffect(() => {
    fetchActiveAds();
  }, []);

  const fetchActiveAds = async () => {
    setLoading(true);
    try {
      const res = await apiHandler({ url: "/api/v1/ads/active", method: "GET" });
      if (res && res.success && Array.isArray(res.data)) {
        setAds(res.data as AdRecord[]);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch ads");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setLink("");
    setImageFile(null);
  };

  const validateUrl = (url: string) => {
    try {
      // use URL constructor for validation
      // allow http and https only
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (file) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        toast({ title: "Invalid file", description: "Only JPG, PNG, WEBP are allowed", variant: "destructive" });
        return;
      }
      setImageFile(file);
    }
  };

  // Create
  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    // validate all fields
    if (!title.trim()) {
      toast({ title: "Validation", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!subtitle.trim()) {
      toast({ title: "Validation", description: "Subtitle is required", variant: "destructive" });
      return;
    }
    if (!link.trim() || !validateUrl(link.trim())) {
      toast({ title: "Validation", description: "Valid link is required (http(s)://...)", variant: "destructive" });
      return;
    }
    if (!imageFile) {
      toast({ title: "Validation", description: "Image is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("subtitle", subtitle.trim());
      fd.append("link", link.trim());
      fd.append("image", imageFile);

      const res = await apiHandler({ url: "/api/v1/ads", method: "POST", data: fd });
      if (res && res.success) {
        toast({ title: "Success", description: "Ad created successfully", variant: "success" });
        setCreateOpen(false);
        resetForm();
        fetchActiveAds();
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Create failed");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Edit
  const openEdit = async (id: number) => {
    try {
      setLoading(true);
      const res = await apiHandler({ url: `/api/v1/ads/${id}`, method: "GET" });
      if (res && res.success && res.data) {
        const d = res.data as AdRecord;
        setSelectedAd(d);
        setTitle(d.title || "");
        setSubtitle(d.subtitle || "");
        setLink(d.link || "");
        // image: require uploading new image per requirement, so clear imageFile
        setImageFile(null);
        setEditOpen(true);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch ad");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAd) return;
    if (!title.trim()) {
      toast({ title: "Validation", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!subtitle.trim()) {
      toast({ title: "Validation", description: "Subtitle is required", variant: "destructive" });
      return;
    }
    if (!link.trim() || !validateUrl(link.trim())) {
      toast({ title: "Validation", description: "Valid link is required (http(s)://...)", variant: "destructive" });
      return;
    }
    if (!imageFile) {
      toast({ title: "Validation", description: "Image is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("subtitle", subtitle.trim());
      fd.append("link", link.trim());
      fd.append("image", imageFile as File);

      const res = await apiHandler({ url: `/api/v1/ads/${selectedAd.id}`, method: "PUT", data: fd });
      if (res && res.success) {
        toast({ title: "Success", description: "Ad updated successfully", variant: "success" });
        setEditOpen(false);
        setSelectedAd(null);
        resetForm();
        fetchActiveAds();
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Update failed");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const openDelete = (ad: AdRecord) => {
    setSelectedAd(ad);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAd) return;
    setDeleting(true);
    try {
      const res = await apiHandler({ url: `/api/v1/ads/${selectedAd.id}`, method: "DELETE" });
      if (res && res.success) {
        toast({ title: "Deleted", description: "Ad deleted successfully", variant: "success" });
        setDeleteOpen(false);
        setSelectedAd(null);
        fetchActiveAds();
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Delete failed");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ads</h1>
          <p className="text-muted-foreground">Manage Ads (create, update, delete)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Create Ad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-1 shadow rounded-md p-4">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-32">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : ads.length > 0 ? (
          ads.map(ad => (
            <Card key={ad.id} className="p-0 gap-0">
              <div className="relative w-full h-48 rounded overflow-hidden">
                <Image src={ad.image} alt={ad.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                  {ad.title && (
                      <h3 className="text-lg font-semibold">{ad.title}</h3>
                  )}
                  {ad.subtitle && (
                        <p className="text-sm text-muted-foreground">{ad.subtitle}</p>
                  )}
                  {ad.link && (
                      <p className="text-sm text-primary break-words"><strong className="mr-2">URL :</strong><a href={ad.link} target="_blank" rel="noreferrer">{ad.link}</a></p>
                  )}
                  {ad.createdByUser && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Created by: {ad.createdByUser.fullName} at {formatDate(ad.createdAt)}
                  </p>
                  )}
                  {ad.updatedByUser && ad.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                        Updated by: {ad.updatedByUser.fullName} at {formatDate(ad.updatedAt)}
                    </p>
                  )}
              </div>
              <div className="p-4 flex justify-end items-center gap-2">
                <Button size="sm" onClick={() => openEdit(ad.id)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => openDelete(ad)} className="cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-0 border-none shadow-none min-h-48 flex justify-between items-center text-center text-muted-foreground col-span-full">No active ads found.</Card>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Ad</DialogTitle>
            <DialogDescription>Create a new advertisement (all fields are required).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-start gap-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Subtitle *</Label>
              <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Link *</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Image *</Label>
              <Dropzone
                src={imageFile ? [imageFile] : undefined}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp'],
                    'image/gif': ['.gif']
                }}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                onDrop={handleDrop}
                className="h-48"
              >
                <DropzoneContent>
                  {imageFile ? (
                    <div className="relative w-full h-44">
                      <Image src={URL.createObjectURL(imageFile)} alt="preview" fill className="object-contain rounded-md" />
                    </div>
                  ) : (
                    <DropzoneEmptyState>
                      <div className="text-sm font-medium">Drag & drop an image here or click to browse</div>
                      <div className="text-xs text-muted-foreground mt-1">Accepted: JPG, PNG, WEBP, GIF — Max 5MB</div>
                    </DropzoneEmptyState>
                  )}
                </DropzoneContent>
              </Dropzone>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="cursor-pointer">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Ad</DialogTitle>
            <DialogDescription>Update advertisement (all fields are required, select new image to replace).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-start gap-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Subtitle *</Label>
              <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Link *</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Label>Image *</Label>
              <Dropzone
                // Only provide File[] to the Dropzone `src` prop — do not pass string URLs.
                src={imageFile ? [imageFile] : undefined}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp'],
                    'image/gif': ['.gif']
                }}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                onDrop={handleDrop}
                className="h-48"
              >
                <DropzoneContent>
                  {imageFile ? (
                    <div className="relative w-full h-44">
                      <Image src={URL.createObjectURL(imageFile)} alt="preview" fill className="object-cover rounded-md" />
                    </div>
                  ) : selectedAd?.image ? (
                    <div className="relative w-full h-44">
                      <Image src={selectedAd.image} alt="current" fill className="object-contain rounded-md" />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-sm">Current Image - select new to replace</div>
                    </div>
                  ) : (
                    <DropzoneEmptyState>
                      <div className="text-sm font-medium">Drag & drop an image here or click to browse</div>
                      <div className="text-xs text-muted-foreground mt-1">Accepted: JPG, PNG, WEBP, GIF — Max 5MB</div>
                    </DropzoneEmptyState>
                  )}
                </DropzoneContent>
              </Dropzone>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedAd(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the ad.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white" onClick={handleDelete}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
