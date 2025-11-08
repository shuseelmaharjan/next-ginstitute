"use client";

import React, { useEffect, useState } from "react";
import apiHandler from "@/app/api/apiHandler";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import DownloadForm from "./downloads/DownloadForm";
import DeleteConfirm from "./downloads/DeleteConfirm";
import { toast } from "@/components/hooks/use-toast";
import Image from "next/image";
import {formatDate} from "@/utils/formatDate";

type Download = {
  id: number;
  label: string;
  description?: string | null;
  fileType: "pdf" | "image";
  fileUrl: string;
  isActive: boolean;
  createdBy?: string | number;
  createdByUser?: { id: number; fullName: string } | null;
  updatedByUser?: { id: number; fullName?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

// Helper function to strip HTML tags and truncate text
const stripHtmlAndTruncate = (html: string | null | undefined, maxLength: number = 150): string => {
  if (!html) return "";
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  // Truncate if needed
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = useState<Download | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchActive = async () => {
    setLoading(true);
    try {
      const res = await apiHandler<{ success: boolean; message: string; data: Download[] }>(
        { url: "/api/v1/downloads/active", method: "GET" }
      );
      setDownloads(res.data ?? []);
      setFilterType(null);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Failed to load downloads", description: msg || "Could not fetch active downloads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchByType = async (type: string) => {
    setLoading(true);
    try {
      const res = await apiHandler<{ success: boolean; message: string; data: Download[] }>(
        { url: `/api/v1/downloads/type/${type}`, method: "GET" }
      );
      setDownloads(res.data ?? []);
      setFilterType(type);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Failed to load downloads", description: msg || `Could not fetch ${type} downloads`, variant: "destructive" });
    } finally {
      setLoading(false);
      setSheetOpen(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const openCreate = () => {
    setSelected(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openView = (item: Download) => {
    setSelected(item);
    setFormMode("view");
    setFormOpen(true);
  };

  const openEdit = (item: Download) => {
    setSelected(item);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDelete = (id: number) => {
    setToDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDeleteId) return;
    setDeleting(true);
    try {
      await apiHandler<{ success: boolean; message?: string }>({ url: `/api/v1/downloads/${toDeleteId}`, method: "DELETE" });
      toast({ title: "Deleted", description: "Download deleted", variant: "success" });
      setDeleteOpen(false);
      fetchActive();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Delete failed", description: msg || "Could not delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="text-muted-foreground">
                Manage downloadable files such as PDFs and images.
            </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="cursor-pointer">Filter</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="p-4">
                <SheetTitle>Filter downloads</SheetTitle>
                <div className="mt-4 flex flex-col gap-2">
                  <Button className="cursor-pointer" onClick={() => fetchActive()} variant={filterType === null ? "secondary" : "ghost"}>All active</Button>
                  <Button className="cursor-pointer" onClick={() => fetchByType("pdf")} variant={filterType === "pdf" ? "secondary" : "ghost"}>PDF</Button>
                  <Button className="cursor-pointer" onClick={() => fetchByType("image")} variant={filterType === "image" ? "secondary" : "ghost"}>Images</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button onClick={openCreate} className="cursor-pointer">Create</Button>
        </div>
      </div>

      <div className="border-1 p-4 rounded-md shadow">
        {loading ? (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        ) : downloads.length === 0 ? (
          <div className="text-muted-foreground">No downloads found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {downloads.map((d) => (
              <div key={d.id} className="p-4 border rounded-md flex items-start gap-4">
                <div className="w-24 h-24 bg-gray-50 flex items-center justify-center overflow-hidden rounded">
                  {d.fileType === "pdf" ? (
                    <iframe src={d.fileUrl} className="w-full h-full" />
                  ) : (
                    <Image src={d.fileUrl} alt={d.label} width={96} height={96} className="object-cover w-full h-full" unoptimized />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.label}</div>
                      <div className="text-sm text-muted-foreground">{stripHtmlAndTruncate(d.description)}</div>
                    </div>
                  </div>
                    <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openView(d)}>View</Button>
                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openEdit(d)}>Edit</Button>
                        <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => openDelete(d.id)}>Delete</Button>
                    </div>
                  <div className="text-xs text-muted-foreground mt-2">Uploaded by: {d.createdByUser?.fullName ?? d.createdBy} at {d.createdAt ? formatDate(d.createdAt) : "N/A"}</div>
                    {d.updatedByUser && (
                        <div className="text-xs text-muted-foreground">Last updated by: {d.updatedByUser.fullName ?? "Unknown"} at {d.updatedAt ? formatDate(d.updatedAt) : "N/A"}</div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DownloadForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => fetchActive()}
        initialData={selected}
        mode={formMode}
      />

      <DeleteConfirm
        open={deleteOpen}
        onCancelAction={() => setDeleteOpen(false)}
        onConfirmAction={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default DownloadsPage;
