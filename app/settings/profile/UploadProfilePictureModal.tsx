"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Camera, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import apiHandler from "@/app/api/apiHandler";
import config from "@/app/config";

interface UploadProfilePictureModalProps {
    onUploaded?: () => Promise<void> | void;
    currentImage?: string | null;
    triggerClassName?: string;
}

// Helper to build absolute src
function buildImageSrc(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("blob:")) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = config.BASE_URL?.replace(/\/$/, "") || "";
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

export const UploadProfilePictureModal: React.FC<UploadProfilePictureModalProps> = ({ onUploaded, currentImage, triggerClassName }) => {

    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const reset = () => {
        setFile(null);
        setPreview(null);
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (!/(jpe?g|png)$/i.test(f.name)) {
            toast({ title: "Invalid file type", description: "Only JPG or PNG allowed", variant: "destructive" });
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
            return;
        }
        setFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            const res: any = await apiHandler({ url: "/api/v1/users/upload-profile-picture", method: "POST", data: formData });
            if (res?.success) {
                toast({ title: "Profile picture updated", description: "Your picture was uploaded successfully.", variant: "success" });
                await onUploaded?.();
                setOpen(false);
                reset();
            } else {
                toast({ title: "Upload failed", description: res?.message || "Could not upload image", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Upload error", description: err.message || "Unexpected error", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={triggerClassName}>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                    <DialogDescription>
                        Choose an image (JPG or PNG, max 5MB) and then confirm upload.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 rounded-full border flex items-center justify-center overflow-hidden bg-muted relative">
                            {preview ? (
                                <img src={buildImageSrc(preview)} alt="Preview" className="object-cover w-full h-full" />
                            ) : currentImage ? (
                                <img src={buildImageSrc(currentImage)} alt="Current" className="object-cover w-full h-full" />
                            ) : (
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                            {file && (
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                                    aria-label="Remove selected file"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={handleSelect}
                            />
                            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
                                Select Image
                            </Button>
                            {file && (
                                <p className="text-xs text-muted-foreground max-w-xs text-center break-all">
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2 justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={uploading} className="cursor-pointer">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleUpload} disabled={!file || uploading} className="cursor-pointer">
                        {uploading && <UploadCloud className="h-4 w-4 mr-2 animate-pulse" />}
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>
            <Toaster />

        </Dialog>
    );
};
