"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/hooks/use-toast";
import { Plus, MoreHorizontal, Upload, Trash2, Edit, X, Eye, Download, Grid3X3, List, Image as ImageIcon } from "lucide-react";
import apiHandler from "@/app/api/apiHandler";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface GalleryGroup {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    createdByUser: {
        id: number;
        fullName: string;
    };
    updatedByUser: {
        id: number;
        fullName: string;
    } | null;
}

interface GalleryImage {
    id: number;
    image: string;
    imageGroup: number;
    createdBy: string;
    createdByUser: {
        id: number;
        fullName: string;
    };
    galleryGroup: {
        id: number;
        name: string;
        description: string;
    };
    metadata?: {
        size: number;
        dimensions: { width: number; height: number };
        format: string;
    };
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

const GalleryPage = () => {
    // State management
    const [galleryGroups, setGalleryGroups] = useState<GalleryGroup[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
    const [selectedImages, setSelectedImages] = useState<number[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Image viewer state
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Dialog states
    const [groupDialog, setGroupDialog] = useState(false);
    const [editGroupDialog, setEditGroupDialog] = useState(false);
    const [deleteGroupDialog, setDeleteGroupDialog] = useState(false);
    const [deleteImagesDialog, setDeleteImagesDialog] = useState(false);
    const [imageViewDialog, setImageViewDialog] = useState(false);
    const [uploadDialog, setUploadDialog] = useState(false);
    const [imageInfoDialog, setImageInfoDialog] = useState(false);

    // Form states
    const [groupForm, setGroupForm] = useState({ name: "", description: "" });
    const [editingGroup, setEditingGroup] = useState<GalleryGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<GalleryGroup | null>(null);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadGroupId, setUploadGroupId] = useState<number | null>(null);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);

    // Fetch gallery groups
    const fetchGalleryGroups = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiHandler<ApiResponse<GalleryGroup[]>>({
                url: "/api/v1/gallery-groups/active",
                method: "GET",
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                setGalleryGroups(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch gallery groups:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch gallery images
    const fetchGalleryImages = useCallback(async (groupId?: number) => {
        try {
            setLoading(true);
            const url = groupId ? `/api/v1/gallery/group/${groupId}` : "/api/v1/gallery";

            const response = await apiHandler<ApiResponse<GalleryImage[]>>({
                url,
                method: "GET",
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                setGalleryImages(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch gallery images:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter and search images
    useEffect(() => {
        let filtered = galleryImages;

        // Filter by group
        if (selectedFilter) {
            filtered = filtered.filter(img => img.imageGroup === selectedFilter);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(img =>
                img.galleryGroup.name.toLowerCase().includes(query) ||
                img.galleryGroup.description.toLowerCase().includes(query) ||
                img.createdByUser.fullName.toLowerCase().includes(query)
            );
        }

        setFilteredImages(filtered);
    }, [galleryImages, selectedFilter, searchQuery]);

    // Create gallery group
    const createGalleryGroup = async () => {
        if (!groupForm.name.trim()) {
            toast({ title: "Error", description: "Group name is required", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const response = await apiHandler<ApiResponse<GalleryGroup>>({
                url: "/api/v1/gallery-groups",
                method: "POST",
                data: groupForm,
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                toast({ title: "Success", description: "Gallery group created successfully", variant:"success" });
                setGroupForm({ name: "", description: "" });
                setGroupDialog(false);
                fetchGalleryGroups();
            }
        } catch (error) {
            console.error("Failed to create gallery group:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update gallery group
    const updateGalleryGroup = async () => {
        if (!editingGroup || !groupForm.name.trim()) return;

        try {
            setLoading(true);
            const response = await apiHandler<ApiResponse<GalleryGroup>>({
                url: `/api/v1/gallery-groups/${editingGroup.id}`,
                method: "PUT",
                data: groupForm,
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                toast({ title: "Success", description: "Gallery group updated successfully", variant:"success" });
                setEditGroupDialog(false);
                setEditingGroup(null);
                setGroupForm({ name: "", description: "" });
                fetchGalleryGroups();
            }
        } catch (error) {
            console.error("Failed to update gallery group:", error);
        } finally {
            setLoading(false);
        }
    };

    // Delete gallery group
    const deleteGalleryGroup = async () => {
        if (!deletingGroup) return;

        try {
            setLoading(true);
            await apiHandler({
                url: `/api/v1/gallery-groups/${deletingGroup.id}`,
                method: "DELETE",
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            toast({ title: "Success", description: "Gallery group deleted successfully", variant:"success"});
            setDeleteGroupDialog(false);
            setDeletingGroup(null);
            fetchGalleryGroups();
            if (selectedFilter === deletingGroup.id) {
                setSelectedFilter(null);
            }
        } catch (error) {
            console.error("Failed to delete gallery group:", error);
        } finally {
            setLoading(false);
        }
    };

    // Upload images
    const uploadImages = async () => {
        if (uploadFiles.length === 0 || !uploadGroupId) {
            toast({ title: "Error", description: "Please select files and a group", variant: "destructive" });
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            uploadFiles.forEach((file) => formData.append("images", file));
            formData.append("imageGroupId", uploadGroupId.toString());

            const response = await apiHandler<ApiResponse<GalleryImage[]>>({
                url: "/api/v1/gallery/upload",
                method: "POST",
                data: formData,
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                toast({ title: "Success", description: response.message, variant:"success" });
                setUploadDialog(false);
                setUploadFiles([]);
                setUploadGroupId(null);
                fetchGalleryImages(selectedFilter || undefined);
            }
        } catch (error) {
            console.error("Failed to upload images:", error);
        } finally {
            setUploading(false);
        }
    };

    // Delete selected images
    const deleteSelectedImages = async () => {
        if (selectedImages.length === 0) return;

        try {
            setLoading(true);
            if (selectedImages.length === 1) {
                await apiHandler({
                    url: `/api/v1/gallery/${selectedImages[0]}`,
                    method: "DELETE",
                    onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
                });
            } else {
                await apiHandler({
                    url: "/api/v1/gallery/bulk-delete",
                    method: "DELETE",
                    data: { ids: selectedImages },
                    onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
                });
            }

            toast({
                title: "Success",
                description: `${selectedImages.length} image(s) deleted successfully`,
                variant:"success",
            });
            setDeleteImagesDialog(false);
            setSelectedImages([]);
            fetchGalleryImages(selectedFilter || undefined);
        } catch (error) {
            console.error("Failed to delete images:", error);
        } finally {
            setLoading(false);
        }
    };

    // Image selection handlers
    const toggleImageSelection = (imageId: number) => {
        setSelectedImages(prev =>
            prev.includes(imageId)
                ? prev.filter(id => id !== imageId)
                : [...prev, imageId]
        );
    };

    const selectAllImages = () => {
        setSelectedImages(filteredImages.map(img => img.id));
    };

    const deselectAllImages = () => {
        setSelectedImages([]);
    };

    // Image navigation
    const navigateImage = (direction: 'prev' | 'next') => {
        if (currentImageIndex === null) return;

        const newIndex = direction === 'prev'
            ? Math.max(0, currentImageIndex - 1)
            : Math.min(filteredImages.length - 1, currentImageIndex + 1);

        setCurrentImageIndex(newIndex);
        resetImageViewer();
    };

    // Image viewer controls
    const resetImageViewer = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const zoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const rotateImage = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Mouse wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    };

    // Mouse drag for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Download image
    const downloadImage = async (imageUrl: string, imageName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = imageName || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            toast({ title: "Error", description: "Failed to download image", variant: "destructive" });
        }
    };

    // Open edit group dialog
    const openEditGroupDialog = async (group: GalleryGroup) => {
        try {
            const response = await apiHandler<ApiResponse<GalleryGroup>>({
                url: `/api/v1/gallery-groups/${group.id}`,
                method: "GET",
                onError: (message) => toast({ title: "Error", description: message, variant: "destructive" })
            });

            if (response.success) {
                setEditingGroup(response.data);
                setGroupForm({
                    name: response.data.name,
                    description: response.data.description
                });
                setEditGroupDialog(true);
            }
        } catch (error) {
            console.error("Failed to fetch group details:", error);
        }
    };

    // Initialize data
    useEffect(() => {
        fetchGalleryGroups();
        fetchGalleryImages();
    }, [fetchGalleryGroups, fetchGalleryImages]);

    // Reset image viewer when dialog opens/closes
    useEffect(() => {
        if (!imageViewDialog) {
            resetImageViewer();
        }
    }, [imageViewDialog]);

    const currentImage = currentImageIndex !== null ? filteredImages[currentImageIndex] : null;

    return (
        <div className="space-y-6 mt-4">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
                    <p className="text-muted-foreground">
                        Manage your gallery images and organize them into groups for better categorization.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {selectedImages.length > 0 && (
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1">
                                {selectedImages.length} selected
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAllImages}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteImagesDialog(true)}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </Button>
                        </div>
                    )}
                    {/* View Mode Toggle */}
                    <TooltipProvider>
                        <div className="flex border rounded-lg p-1 bg-muted/50">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("grid")}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Grid View</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={viewMode === "list" ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>List View</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setUploadDialog(true)}>
                        <Upload className="w-4 h-4" />
                        Add Images
                    </Button>
                    <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Upload Images</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                                {/* Drag and Drop Zone */}
                                <div>
                                    <Label className="mb-2">Select Images</Label>
                                    <div
                                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
                                        onClick={() => document.getElementById('file-input')?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('border-primary');
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-primary');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-primary');
                                            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                                            setUploadFiles(prev => [...prev, ...files]);
                                        }}
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Upload className="w-10 h-10 text-muted-foreground" />
                                            <div>
                                                <p className="text-lg font-medium">Drag and drop images here</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    or click to browse files from your computer
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Supports PNG, JPG, JPEG, WEBP, HEIC • Max 10MB per file
                                            </p>
                                        </div>
                                    </div>
                                    <Input
                                        id="file-input"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setUploadFiles(prev => [...prev, ...files]);
                                        }}
                                    />
                                </div>

                                {/* Image Preview Grid */}
                                {uploadFiles.length > 0 && (
                                    <div className="py-2">
                                        <Label className="text-sm font-medium mb-3 block">
                                            Selected Images ({uploadFiles.length})
                                        </Label>
                                        <ScrollArea className="h-48 border rounded-lg p-3">
                                            <div className="grid grid-cols-3 gap-3">
                                                {uploadFiles.map((file, index) => (
                                                    <div key={index} className="relative group">
                                                        <div className="aspect-square rounded-md overflow-hidden bg-muted border">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newFiles = uploadFiles.filter((_, i) => i !== index);
                                                                setUploadFiles(newFiles);
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                        <p className="text-xs text-muted-foreground mt-1 truncate text-center">
                                                            {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}

                                <div>
                                    <Label className="mb-2">Select Gallery Group</Label>
                                    <Select
                                        value={uploadGroupId ? uploadGroupId.toString() : ""}
                                        onValueChange={(value) => setUploadGroupId(Number(value) || null)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a group" />
                                        </SelectTrigger>
                                        <SelectContent className="w-full">
                                            {galleryGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id.toString()}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setUploadDialog(false);
                                        setUploadFiles([]);
                                    }}
                                    disabled={uploading}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={uploadImages}
                                    disabled={uploading || uploadFiles.length === 0 || !uploadGroupId}
                                    className="cursor-pointer"
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                                    ) : (
                                        `Upload ${uploadFiles.length} Image${uploadFiles.length !== 1 ? 's' : ''}`
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Images Section */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Images Grid/List */}
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredImages.map((image, index) => (
                                <ContextMenu key={image.id} >
                                    <ContextMenuTrigger className="rounded-none">
                                        <Card className="group py-0 rounded-none cursor-pointer hover:shadow-lg transition-all duration-200 relative overflow-hidden border-0 shadow-sm">
                                            {/* Checkbox */}
                                            <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Checkbox
                                                    checked={selectedImages.includes(image.id)}
                                                    onCheckedChange={() => toggleImageSelection(image.id)}
                                                    className="border-2 border-white bg-white/90"
                                                />
                                            </div>

                                            {/* Action Overlay */}
                                            <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="flex items-center gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCurrentImageIndex(index);
                                                                        setImageViewDialog(true);
                                                                    }}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Preview</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        downloadImage(image.image, `image-${image.id}`);
                                                                    }}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Download</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>

                                            {/* Image */}
                                            <div className="aspect-square overflow-hidden rounded-none bg-muted/50 leading-none">
                                                <img
                                                    src={image.image}
                                                    alt="Gallery image"
                                                    className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </div>

                                        </Card>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => toggleImageSelection(image.id)}>
                                            {selectedImages.includes(image.id) ? "Deselect" : "Select"}
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => {
                                            setCurrentImageIndex(index);
                                            setImageViewDialog(true);
                                        }}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Preview
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => downloadImage(image.image, `image-${image.id}`)}>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem onClick={selectAllImages}>
                                            Select All
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={deselectAllImages}>
                                            Deselect All
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem
                                            onClick={() => {
                                                setSelectedImages([image.id]);
                                                setDeleteImagesDialog(true);
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Image
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>
                    ) : (
                        // List View
                        <div className="space-y-3">
                            {filteredImages.map((image, index) => (
                                <Card key={image.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                                <img
                                                    src={image.image}
                                                    alt="Gallery image"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary">
                                                    {image.galleryGroup.name}
                                                </Badge>
                                                <p className="text-sm text-muted-foreground">
                                                    Uploaded by {image.createdByUser.fullName}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {image.galleryGroup.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedImages.includes(image.id)}
                                                onCheckedChange={() => toggleImageSelection(image.id)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setCurrentImageIndex(index);
                                                    setImageViewDialog(true);
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => downloadImage(image.image, `image-${image.id}`)}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {filteredImages.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-lg font-medium text-muted-foreground mb-2">
                                    No images found
                                </p>
                                <p className="text-sm text-muted-foreground text-center max-w-sm">
                                    {searchQuery || selectedFilter
                                        ? "Try adjusting your search or filter criteria"
                                        : "Get started by uploading your first images"}
                                </p>
                                {(searchQuery || selectedFilter) && (
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedFilter(null);
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Gallery Groups Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Gallery Groups</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => setGroupDialog(true)} className="cursor-pointer">
                                    <Plus className="w-4 h-4 mr-1" />
                                    New Group
                                </Button>
                                <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Gallery Group</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Group Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Enter group name"
                                                    value={groupForm.name}
                                                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Enter group description"
                                                    value={groupForm.description}
                                                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => setGroupDialog(false)}
                                                disabled={loading}
                                                className="cursor-pointer"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={createGalleryGroup}
                                                disabled={loading || !groupForm.name.trim()}
                                                className="cursor-pointer"
                                            >
                                                {loading ? "Creating..." : "Create Group"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ScrollArea className="h-[400px]">
                                <div className="font-semibold flex justify-between items-center p-3 rounded-lg border transition-colors cursor-pointer mb-2" onClick={() => setSelectedFilter(null)}>
                                    All Images
                                </div>
                                <div className="space-y-2">
                                    {galleryGroups.map((group) => (
                                        <div
                                            key={group.id}
                                            className={`flex justify-between items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                                                selectedFilter === group.id
                                                    ? "bg-primary/10 border-primary"
                                                    : "hover:bg-muted/50"
                                            }`}
                                            onClick={() => setSelectedFilter(selectedFilter === group.id ? null : group.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium truncate">{group.name}</p>
                                                    {selectedFilter === group.id && (
                                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                                    )}
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="w-3 h-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditGroupDialog(group)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setDeletingGroup(group);
                                                            setDeleteGroupDialog(true);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>

                                {galleryGroups.length === 0 && (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                            <Plus className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            No gallery groups yet
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => setGroupDialog(true)}
                                        >
                                            Create Group
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Statistics Card */}
                    <Card className="space-y-0 gap-1">
                        <CardHeader className="pb-0 mb-0">
                            <CardTitle className="text-lg">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 py-0 mt-0">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Images</span>
                                <Badge variant="secondary">{galleryImages.length}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Filtered Images</span>
                                <Badge variant="secondary">{filteredImages.length}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Groups</span>
                                <Badge variant="secondary">{galleryGroups.length}</Badge>
                            </div>
                            {selectedImages.length > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Selected</span>
                                    <Badge variant="default">{selectedImages.length}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Group Dialog */}
            <Dialog open={editGroupDialog} onOpenChange={setEditGroupDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Gallery Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Group Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Enter group name"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Enter group description"
                                value={groupForm.description}
                                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditGroupDialog(false);
                                setEditingGroup(null);
                                setGroupForm({ name: "", description: "" });
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={updateGalleryGroup}
                            disabled={loading || !groupForm.name.trim()}
                        >
                            {loading ? "Updating..." : "Update Group"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Group Confirmation */}
            <AlertDialog open={deleteGroupDialog} onOpenChange={setDeleteGroupDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gallery Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{deletingGroup?.name}&rdquo;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
              onClick={deleteGalleryGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Images Confirmation */}
      <AlertDialog open={deleteImagesDialog} onOpenChange={setDeleteImagesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Images</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedImages.length} selected image(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelectedImages}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : `Delete ${selectedImages.length} Image(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

            {/* Image Viewer Dialog */}
            {imageViewDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="relative flex flex-col w-full h-full max-w-7xl max-h-[95vh] bg-white rounded-lg shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold text-gray-800">
              Image {currentImageIndex! + 1} of {filteredImages.length}
            </span>
                                    <div className="flex flex-col items-start justify-start">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-black text-sm font-medium">
              {currentImage?.galleryGroup.name}
            </span>
                                        <Separator/>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-black text-sm font-medium">
              {currentImage?.galleryGroup.description}
            </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                {/* Info Button */}
                                <button
                                    onClick={() => setImageInfoDialog(true)}
                                    className="flex items-center cursor-pointer px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Info</span>
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => setImageViewDialog(false)}
                                    className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all duration-200 shadow-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Main Image Content */}
                        <div className="relative flex-1 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                            {currentImage && (
                                <>
                                    {/* Navigation Arrows */}
                                    <button
                                        onClick={() => navigateImage('prev')}
                                        disabled={currentImageIndex === 0}
                                        className={`absolute left-6 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${
                                            currentImageIndex === 0
                                                ? 'opacity-30 cursor-not-allowed'
                                                : 'opacity-80 hover:opacity-100 hover:scale-110 hover:shadow-2xl'
                                        } border border-white/20`}
                                    >
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => navigateImage('next')}
                                        disabled={currentImageIndex === filteredImages.length - 1}
                                        className={`absolute right-6 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 ${
                                            currentImageIndex === filteredImages.length - 1
                                                ? 'opacity-30 cursor-not-allowed'
                                                : 'opacity-80 hover:opacity-100 hover:scale-110 hover:shadow-2xl'
                                        } border border-white/20`}
                                    >
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Image Counter */}
                                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-white text-sm font-medium">
                {currentImageIndex! + 1} / {filteredImages.length}
              </span>
                                    </div>

                                    {/* Zoom Level Display */}
                                    <div className="absolute top-6 right-6 z-20 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
              <span className="text-white text-sm font-mono">
                {Math.round(zoom * 100)}%
              </span>
                                    </div>

                                    {/* Image Container */}
                                    <div
                                        className="flex items-center justify-center w-full h-full cursor-move"
                                        onWheel={handleWheel}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                    >
                                        <img
                                            ref={imageRef}
                                            src={currentImage.image}
                                            alt="Gallery image"
                                            className="max-w-full max-h-full object-contain transition-all duration-200 ease-out"
                                            style={{
                                                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                                                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                            }}
                                        />
                                    </div>

                                </>
                            )}
                        </div>

                        {/* Controls Footer */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4">
                            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">

                                {/* Zoom Controls */}
                                <div className="flex items-center space-x-4 flex-1 max-w-2xl">
                                    {/* Zoom Out */}
                                    <button
                                        onClick={zoomOut}
                                        disabled={zoom <= 0.5}
                                        className={`p-3 rounded-xl border transition-all duration-200 ${
                                            zoom <= 0.5
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>

                                    {/* Zoom Slider */}
                                    <div className="flex-1 relative">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-8">50%</span>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="3"
                                                step="0.1"
                                                value={zoom}
                                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                                            />
                                            <span className="text-sm font-medium text-gray-600 min-w-8">300%</span>
                                        </div>
                                        <div className="absolute top-6 left-0 right-0 flex justify-center">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                  Zoom: {Math.round(zoom * 100)}%
                </span>
                                        </div>
                                    </div>

                                    {/* Zoom In */}
                                    <button
                                        onClick={zoomIn}
                                        disabled={zoom >= 3}
                                        className={`p-3 rounded-xl border transition-all duration-200 ${
                                            zoom >= 3
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-3">
                                    {/* Rotate Button */}
                                    <button
                                        onClick={rotateImage}
                                        className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Rotate</span>
                                    </button>

                                    {/* Reset Button */}
                                    <button
                                        onClick={resetImageViewer}
                                        className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Reset</span>
                                    </button>

                                    {/* Download Button */}
                                    {currentImage && (
                                        <button
                                            onClick={() => downloadImage(currentImage.image, `image-${currentImage.id}`)}
                                            className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 hover:border-blue-800 transition-all duration-200 shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Download</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Zoom Instructions */}
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-500">
                                    Use mouse wheel to zoom • Click and drag to pan when zoomed in
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

      {/* Image Info Dialog */}
      <Dialog open={imageInfoDialog} onOpenChange={setImageInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Information</DialogTitle>
          </DialogHeader>
          {currentImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Group</Label>
                  <p>{currentImage.galleryGroup.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Uploaded By</Label>
                  <p>{currentImage.createdByUser.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Group Description</Label>
                  <p className="text-sm">{currentImage.galleryGroup.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Image ID</Label>
                  <p className="text-sm font-mono">{currentImage.id}</p>
                </div>
              </div>
              {currentImage.metadata && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Metadata</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Dimensions: </span>
                        <span className="text-sm">
                          {currentImage.metadata.dimensions.width} × {currentImage.metadata.dimensions.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Format: </span>
                        <span className="text-sm">{currentImage.metadata.format}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Size: </span>
                        <span className="text-sm">
                          {(currentImage.metadata.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setImageInfoDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GalleryPage;

