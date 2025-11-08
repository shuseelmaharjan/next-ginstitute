"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/hooks/use-toast";
import RichTextEditor from "@/app/components/RichTextEditor";
import apiHandler from "@/app/api/apiHandler";

export default function UpdateAboutByIdPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // helper to safely extract message from unknown error
  const getErrorMessage = (err: unknown, fallback = "An error occurred") => {
    if (err && typeof err === "object" && "message" in err) {
      const maybe = err as { message?: unknown };
      return typeof maybe.message === "string" ? maybe.message : String(maybe.message ?? fallback);
    }
    return fallback;
  };

  // helper to detect empty HTML content (e.g., <p></p>, <p><br></p>, &nbsp;)
  const isHtmlEmpty = (html: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\u00A0/g, "");
    return stripped.trim().length === 0;
  };

  const fetchById = useCallback(async (idParam: string) => {
    setLoading(true);
    try {
      const res = await apiHandler({ url: `/api/v1/about-company/${idParam}`, method: "GET" });
      if (res && res.success && res.data) {
        const d = res.data;
        setDescription(d.description || "");
        setMission(d.mission || "");
        setVision(d.vision || "");
      } else {
        toast({ title: "Not found", description: "No record found for this id", variant: "destructive" });
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch record");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    fetchById(id);
  }, [id, fetchById]);

  const validate = (): boolean => {
    if (!description.trim() || isHtmlEmpty(description)) {
      toast({ title: "Validation", description: "Description is required.", variant: "destructive" });
      return false;
    }
    if (!mission.trim() || isHtmlEmpty(mission)) {
      toast({ title: "Validation", description: "Mission is required.", variant: "destructive" });
      return false;
    }
    if (!vision.trim() || isHtmlEmpty(vision)) {
      toast({ title: "Validation", description: "Vision is required.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== 'string') return;
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { description, mission, vision };
      const res = await apiHandler({ url: `/api/v1/about-company/${id}`, method: "PUT", data: payload });
      if (res && res.success) {
        toast({ title: "Success", description: "About record updated", variant: "success" });
        router.push("/site/about");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Update failed");
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Update About Company</h1>
        <p className="text-muted-foreground">Update About Company information by id.</p>
      </div>

        <Card className="overflow-hidden py-0 rounded-none border-none shadow-none">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <Label className="mb-2 block">Description *</Label>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Enter description..." />
          </div>

          <div>
            <Label className="mb-2 block">Mission *</Label>
            <RichTextEditor value={mission} onChange={setMission} placeholder="Enter mission..." />
          </div>

          <div>
            <Label className="mb-2 block">Vision *</Label>
            <RichTextEditor value={vision} onChange={setVision} placeholder="Enter vision..." />
          </div>

          <div className="flex justify-end items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/site/about")} className="cursor-pointer">Cancel</Button>
            <Button type="submit" disabled={saving || loading} className="cursor-pointer">
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
