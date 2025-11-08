"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Trash2, Loader2 } from "lucide-react";
import apiHandler from "@/app/api/apiHandler";
import { toast } from "@/components/hooks/use-toast";
import {formatDate} from "@/utils/formatDate";

interface AboutRecord {
  id: number;
  description: string;
  mission: string;
  vision: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdByUser?: { id: number; fullName: string } | null;
  updatedByUser?: { id: number; fullName: string } | null;
}

export default function AboutListPage() {
  const [records, setRecords] = useState<AboutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchActive();
  }, []);

  const fetchActive = async () => {
    setLoading(true);
    try {
      const res = await apiHandler({ url: "/api/v1/about-company/active", method: "GET" });
      if (res && res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setRecords(data as AboutRecord[]);
      }
    } catch (err: unknown) {
      const message = (err && typeof err === "object" && "message" in err) ? (err as any).message : "Failed to fetch records";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDelete = (id: number) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      const res = await apiHandler({ url: `/api/v1/about-company/${selectedId}/permanent`, method: "DELETE" });
      if (res && res.success) {
        toast({ title: "Deleted", description: "About record permanently deleted", variant: "success" });
        setDeleteOpen(false);
        setSelectedId(null);
        fetchActive();
      }
    } catch (err: unknown) {
      const message = (err && typeof err === "object" && "message" in err) ? (err as any).message : "Delete failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const record = records[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">About Company</h1>
          <p className="text-muted-foreground">Manage About Company information.</p>
        </div>
        {!record ? (
          <Link href="/site/about/add-about">
            <Button className="cursor-pointer">Add About</Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href={`/site/about/update-about/${record.id}`}>
              <Button className="cursor-pointer">Update Record</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="border-1 p-4 rounded-md shadow grid grid-cols-1 gap-6">
        {loading ? (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        ) : record ? (
          <Card className="overflow-hidden py-0 rounded-none border-none shadow-none">
              <div className="mt-4">
                  <h4 className="font-medium text-xl">About Us</h4>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: record.description }} />
              </div>
            <div className="mt-4">
              <h4 className="font-medium text-xl">Our Mission</h4>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: record.mission }} />
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-xl">Our Vision</h4>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: record.vision }} />
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between">
              <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                      Created: {formatDate(record.createdAt)}
                      {record.createdByUser ? ` by ${record.createdByUser.fullName}` : ""}
                  </div>
                  {record.updatedByUser ? (
                        <div className="text-sm text-muted-foreground">
                            Updated: {formatDate(record.updatedAt!)} by {record.updatedByUser.fullName}
                        </div>
                  ) : (
                      <span>

                      </span>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={() => openDelete(record.id)} className="cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center text-muted-foreground border-none shadow-none">No About record found.</Card>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the selected About record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={handleDelete}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
