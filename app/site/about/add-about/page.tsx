"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/hooks/use-toast";
import RichTextEditor from "@/app/components/RichTextEditor";
import apiHandler from "@/app/api/apiHandler";

export default function AddAboutPage() {
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // helper to detect empty HTML content (e.g., <p></p>, <p><br></p>, &nbsp;)
  const isHtmlEmpty = (html: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\u00A0/g, "");
    return stripped.trim().length === 0;
  };

  const validate = (): boolean => {
    if (isHtmlEmpty(description)) {
      toast({ title: "Validation", description: "Description is required.", variant: "destructive" });
      return false;
    }
    if (isHtmlEmpty(mission)) {
      toast({ title: "Validation", description: "Mission is required.", variant: "destructive" });
      return false;
    }
    if (isHtmlEmpty(vision)) {
      toast({ title: "Validation", description: "Vision is required.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { description, mission, vision };
      const res = await apiHandler({ url: "/api/v1/about-company", method: "POST", data: payload });
      if (res && res.success) {
        toast({ title: "Success", description: "About record created", variant: "success" });
        router.push("/site/about");
      }
    } catch (err: unknown) {
      const message = (err && typeof err === "object" && "message" in err) ? (err as any).message : "Failed to create";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Add About Company</h1>
        <p className="text-muted-foreground">Create About Company information.</p>
      </div>

      <Card className="overflow-hidden py-0 rounded-none border-none shadow-none">
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
