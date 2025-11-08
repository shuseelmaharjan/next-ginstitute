import React, { useEffect, useState } from "react";
import apiHandler from "@/app/api/apiHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/app/components/RichTextEditor";
import { format } from "date-fns";

type Career = {
    id: number;
    title: string;
    position: string;
    description: string;
    requirements: string;
    startsFrom: string;
    endsAt: string;
    isActive: boolean;
    isPending: boolean;
    createdBy?: string;
    updatedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdByUser?: { id: number; fullName: string } | null;
    updatedByUser?: { id: number; fullName?: string } | null;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialData?: Career | null;
    mode?: "create" | "edit" | "view";
};

export default function CareerForm({ open, onClose, onSaved, initialData = null, mode = "create" }: Props) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [position, setPosition] = useState(initialData?.position ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [requirements, setRequirements] = useState(initialData?.requirements ?? "");
    const [startsFrom, setStartsFrom] = useState(
        initialData?.startsFrom ? format(new Date(initialData.startsFrom), 'yyyy-MM-dd') : ""
    );
    const [endsAt, setEndsAt] = useState(
        initialData?.endsAt ? format(new Date(initialData.endsAt), 'yyyy-MM-dd') : ""
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setPosition(initialData?.position ?? "");
            setDescription(initialData?.description ?? "");
            setRequirements(initialData?.requirements ?? "");
            setStartsFrom(
                initialData?.startsFrom ? format(new Date(initialData.startsFrom), 'yyyy-MM-dd') : ""
            );
            setEndsAt(
                initialData?.endsAt ? format(new Date(initialData.endsAt), 'yyyy-MM-dd') : ""
            );
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            console.error("Title is required");
            return;
        }

        if (!position.trim()) {
            console.error("Position is required");
            return;
        }

        if (!startsFrom || !endsAt) {
            console.error("Start and end dates are required");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: title.trim(),
                position: position.trim(),
                description: description.trim(),
                requirements: requirements.trim(),
                startsFrom,
                endsAt
            };

            if (mode === "create") {
                await apiHandler<ApiResponse<Career>>({
                    url: "/api/v1/careers",
                    method: "POST",
                    data: payload
                });
            } else if (mode === "edit" && initialData?.id) {
                await apiHandler<ApiResponse<Career>>({
                    url: `/api/v1/careers/${initialData.id}`,
                    method: "PUT",
                    data: payload
                });
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isView = mode === "view";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-3/5 max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <div>
                        <DialogTitle className="text-2xl font-bold">
                            {mode === "create" ? "Create New Career" :
                                mode === "edit" ? "Edit Career" : position}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === "create"
                                ? "Add a new career opportunity"
                                : mode === "edit"
                                    ? "Update the career details"
                                    : "View career details"}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {isView ? (
                    <div className="flex-1 overflow-auto p-0 space-y-0 border-none shadow-none">
                        <Card className="p-0 border-none shadow-none mb-6">
                            <CardHeader className="bg-amber-600 text-white py-2">
                                <CardTitle className="my-0">Career Information</CardTitle>
                            </CardHeader>
                            <CardContent className="mt-0 pt-0 space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                                        <p className="text-base font-semibold">{title}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                                        <p className="text-base font-semibold">{position}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                        <p className="text-sm">
                                            {initialData?.isActive ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                    Active
                                                </span>
                                            ) : initialData?.isPending ? (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Starts From</Label>
                                        <p className="text-sm">
                                            {startsFrom ? format(new Date(startsFrom), 'PPP') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Ends At</Label>
                                        <p className="text-sm">
                                            {endsAt ? format(new Date(endsAt), 'PPP') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="p-0 border-none shadow-none">
                            <CardHeader className="bg-amber-600 text-white py-2">
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent className="h-auto overflow-y-auto">
                                {description ? (
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: description }}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        No description provided
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="p-0 border-none shadow-none mt-6">
                            <CardHeader className="bg-amber-600 text-white py-2">
                                <CardTitle>Requirements</CardTitle>
                            </CardHeader>
                            <CardContent className="h-auto overflow-y-auto">
                                {requirements ? (
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: requirements }}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        No requirements provided
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="p-0 border-none shadow-none my-6">
                            <CardHeader className="bg-amber-600 text-white py-2">
                                <CardTitle>Audit Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                                        <p className="text-sm">
                                            {initialData?.createdByUser?.fullName || 'System'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                                        <p className="text-sm">
                                            {initialData?.createdAt ? format(new Date(initialData.createdAt), 'PPpp') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                {initialData?.updatedByUser && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Updated By</Label>
                                            <p className="text-sm">
                                                {initialData?.updatedByUser?.fullName || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                                            <p className="text-sm">
                                                {initialData?.updatedAt ? format(new Date(initialData.updatedAt), 'PPpp') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-0">
                        <div className="p-0">
                            <Card className="border-none shadow-none p-0">
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>
                                        Enter the basic details for this career opportunity
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-medium">
                                            Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., For the post of Developer"
                                            className="h-10"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="position" className="text-sm font-medium">
                                            Position *
                                        </Label>
                                        <Input
                                            id="position"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            placeholder="e.g., Senior Developer"
                                            className="h-10"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="startsFrom" className="text-sm font-medium">
                                                Starts From *
                                            </Label>
                                            <Input
                                                id="startsFrom"
                                                type="date"
                                                value={startsFrom}
                                                onChange={(e) => setStartsFrom(e.target.value)}
                                                className="h-10"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endsAt" className="text-sm font-medium">
                                                Ends At *
                                            </Label>
                                            <Input
                                                id="endsAt"
                                                type="date"
                                                value={endsAt}
                                                onChange={(e) => setEndsAt(e.target.value)}
                                                className="h-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium">
                                            Description *
                                        </Label>
                                        <RichTextEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Enter career description"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requirements" className="text-sm font-medium">
                                            Requirements *
                                        </Label>
                                        <RichTextEditor
                                            value={requirements}
                                            onChange={setRequirements}
                                            placeholder="Enter job requirements"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator className="mt-4" />

                        <DialogFooter className="px-6 py-4 bg-muted/20">
                            <div className="flex items-center justify-end w-full gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="min-w-24 cursor-pointer"

                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {mode === "create" ? "Creating..." : "Updating..."}
                                        </span>
                                    ) : (
                                        mode === "create" ? "Create Career" : "Update Career"
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
