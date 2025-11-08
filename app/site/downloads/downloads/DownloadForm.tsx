import React, { useEffect, useState, useCallback } from "react";
import apiHandler from "@/app/api/apiHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import RichTextEditor from "@/app/components/RichTextEditor";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toSentenceCase } from "@/utils/textUtils";
import { format } from "date-fns";
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

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialData?: Download | null;
    mode?: "create" | "edit" | "view";
};

export default function DownloadForm({ open, onClose, onSaved, initialData = null, mode = "create" }: Props) {
    const [label, setLabel] = useState(initialData?.label ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [fileType, setFileType] = useState<string>(initialData?.fileType ?? "pdf");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.fileUrl ?? null);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        if (open) {
            setLabel(initialData?.label ?? "");
            setDescription(initialData?.description ?? "");
            setFileType(initialData?.fileType ?? "pdf");
            setPreviewUrl(initialData?.fileUrl ?? null);
            setFile(null);
            setActiveTab("details");
        }
    }, [initialData, open]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const f = acceptedFiles?.[0] ?? null;
        if (!f) return;

        // Validate file size (5MB max)
        if (f.size > 5 * 1024 * 1024) {
            // TODO: Show toast error
            console.error("File size must be less than 5MB");
            return;
        }

        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: fileType === "image" ? { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] } : { "application/pdf": [".pdf"] },
        multiple: false,
        disabled: mode === "view",
    });

    const handleDelete = async () => {
        if (!initialData?.id) return;

        setDeleteLoading(true);
        try {
            await apiHandler<ApiResponse<Download>>({
                url: `/api/v1/downloads/${initialData.id}`,
                method: "DELETE"
            });
            onSaved();
            onClose();
            setShowDeleteDialog(false);
        } catch (err) {
            console.error(err);
            // TODO: show toast
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!label.trim()) {
            // TODO: Show toast error
            console.error("Label is required");
            return;
        }

        if (mode === "create" && !file) {
            // TODO: Show toast error
            console.error("File is required");
            return;
        }

        setLoading(true);
        try {
            const form = new FormData();
            form.append("label", label.trim());
            form.append("description", description.trim());
            form.append("fileType", fileType);
            if (file) form.append("file", file);

            if (mode === "create") {
                await apiHandler<ApiResponse<Download>>({
                    url: "/api/v1/downloads",
                    method: "POST",
                    data: form
                });
            } else if (mode === "edit" && initialData?.id) {
                await apiHandler<ApiResponse<Download>>({
                    url: `/api/v1/downloads/${initialData.id}`,
                    method: "PUT",
                    data: form
                });
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            // TODO: show toast
        } finally {
            setLoading(false);
        }
    };

    const isView = mode === "view";

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                {mode === "create" ? "Create New Download" :
                                    mode === "edit" ? "Edit Download" : label}
                            </DialogTitle>
                            <DialogDescription>
                                {mode === "create"
                                    ? "Add a new file to your downloads library"
                                    : mode === "edit"
                                        ? "Update the download details and file"
                                        : "View download details and file"}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {isView ? (
                        <div className="flex-1 overflow-hidden">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                                <TabsList className="grid w-full grid-cols-3 px-6">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="preview">Preview</TabsTrigger>
                                    <TabsTrigger value="description">Description</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="flex-1 overflow-auto p-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>File Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Label</Label>
                                                    <p className="text-base font-semibold">{label}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                                                    <p className="text-sm">
                                                        {initialData?.createdAt ? format(new Date(initialData.createdAt), 'PPpp') : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Audit Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {initialData?.createdByUser?.fullName || 'System'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                                                    <p className="text-sm">
                                                        {initialData?.updatedAt ? format(new Date(initialData.updatedAt), 'PPpp') : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            {initialData?.updatedByUser && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Last Updated By</Label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {initialData.updatedByUser.fullName}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="preview" className="flex-1 overflow-auto border-none shadow-none p-0 pb-6">
                                    <Card className="h-full border-none shadow-none p-0">
                                        <CardContent>
                                            <div className="border rounded-lg overflow-hidden bg-muted/50">
                                                {previewUrl ? (
                                                    fileType === "pdf" ? (
                                                        <iframe
                                                            src={previewUrl}
                                                            className="w-full h-[600px]"
                                                            title="PDF Preview"
                                                        />
                                                    ) : (
                                                        <div className="flex justify-center p-4">
                                                            <Image
                                                                src={previewUrl}
                                                                alt="File preview"
                                                                width={800}
                                                                height={600}
                                                                className="object-contain max-h-[500px]"
                                                                unoptimized
                                                            />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="p-12 text-center text-muted-foreground">
                                                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <p>No file available for preview</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="description" className="flex-1 overflow-y-auto p-0 border-none shadow-none rounded-none">
                                    <Card className="h-full border-none shadow-none rounded-none">
                                        <CardHeader>
                                            <CardTitle>Description</CardTitle>
                                            <CardDescription>
                                                Additional information about this download
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="max-h-[400px] overflow-y-auto">
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
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        // Create/Edit Mode - Enhanced Form
                        <form onSubmit={handleSubmit} className="flex-1 overflow-auto border-none shadow-none rounded-none">
                            <div className="p-0">
                                <Card className="border-none shadow-none rounded-none">
                                    <CardHeader>
                                        <CardTitle>Basic Information</CardTitle>
                                        <CardDescription>
                                            Enter the basic details for your download file
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="label" className="text-sm font-medium">
                                                Label *
                                            </Label>
                                            <Input
                                                id="label"
                                                value={label}
                                                onChange={(e) => setLabel(e.target.value)}
                                                placeholder="Enter download label"
                                                className="h-10"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="fileType" className="text-sm font-medium">
                                                File Type *
                                            </Label>
                                            <Select onValueChange={setFileType} value={fileType}>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue>{toSentenceCase(fileType)}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Description
                                            </Label>
                                            <RichTextEditor
                                                value={description}
                                                onChange={setDescription}
                                                placeholder="Enter a description for this download (optional)"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-none rounded-none">
                                    <CardHeader>
                                        <CardTitle>File Upload</CardTitle>
                                        <CardDescription>
                                            {mode === "create"
                                                ? "Choose the file you want to make available for download"
                                                : "Replace the current file with a new one (optional)"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {fileType === "image" ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            {...getRootProps()}
                                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                                                                ${isDragActive
                                                                    ? "border-primary bg-primary/5 scale-[0.99]"
                                                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                                                                }`}
                                                        >
                                                            <input {...getInputProps()} />
                                                            {previewUrl ? (
                                                                <div className="space-y-4">
                                                                    <div className="border rounded-lg overflow-hidden bg-white">
                                                                        {previewUrl.startsWith("blob:") ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img
                                                                                src={previewUrl}
                                                                                alt="File preview"
                                                                                className="w-full max-h-80 object-contain"
                                                                            />
                                                                        ) : (
                                                                            <Image
                                                                                src={previewUrl}
                                                                                alt="File preview"
                                                                                width={600}
                                                                                height={400}
                                                                                className="w-full max-h-80 object-contain"
                                                                                unoptimized
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Click or drag to replace image
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        {isDragActive ? (
                                                                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {isDragActive ? (
                                                                            <p className="text-lg font-medium text-primary">Drop the image here</p>
                                                                        ) : (
                                                                            <div>
                                                                                <p className="text-lg font-medium">Drag &amp; drop an image here</p>
                                                                                <p className="text-sm text-muted-foreground mt-2">
                                                                                    or click to browse files
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs text-muted-foreground mt-3">
                                                                            Supports JPG, PNG, GIF, WebP • Max 5MB
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click or drag and drop to upload image</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <input
                                                            type="file"
                                                            id="pdf-upload"
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0] ?? null;
                                                                if (f) {
                                                                    if (f.size > 5 * 1024 * 1024) {
                                                                        console.error("File size must be less than 5MB");
                                                                        return;
                                                                    }
                                                                    setFile(f);
                                                                    const url = URL.createObjectURL(f);
                                                                    setPreviewUrl(url);
                                                                }
                                                            }}
                                                            accept=".pdf"
                                                            className="hidden"
                                                        />
                                                        <Label
                                                            htmlFor="pdf-upload"
                                                            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span className="text-sm font-medium">
                                                                {file ? file.name : previewUrl ? "Replace PDF File" : "Choose PDF File"}
                                                            </span>
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                                            PDF files only • Max 5MB
                                                        </p>
                                                    </div>
                                                </div>

                                                {previewUrl && (
                                                    <div>
                                                        <Label className="text-sm font-medium mb-3 block">
                                                            {file ? "New PDF Preview" : "Current PDF"}
                                                        </Label>
                                                        <div className="border rounded-lg overflow-hidden bg-muted/50">
                                                            <iframe
                                                                src={previewUrl}
                                                                className="w-full h-96"
                                                                title="PDF Preview"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Separator />

                            <DialogFooter className="px-6 py-4 bg-muted/20">
                                <div className="flex items-center justify-end w-full gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="min-w-24"
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
                                            mode === "create" ? "Create Download" : "Update Download"
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog - Only used when needed */}
            {mode === "edit" && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the download
                                &ldquo;{initialData?.label}&rdquo; and remove it from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
