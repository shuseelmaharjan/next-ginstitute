"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import {
  Plus,
  Edit,
  Eye,
  TrashIcon
} from "lucide-react";
import { toast } from "@/components/hooks/use-toast";
import apiHandler from "../../api/apiHandler";

interface Banner {
  id: number;
  banner: string;
  title: boolean;
  titleText?: string;
  subtitle: boolean;
  subtitleText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface BannerFormData {
  banner: File | null;
  title: boolean;
  titleText: string;
  subtitle: boolean;
  subtitleText: string;
}

const BannerPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    banner: null,
    title: false,
    titleText: '',
    subtitle: false,
    subtitleText: '',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await apiHandler({
        method: 'GET',
        url: '/api/v1/banners/active',
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });
      setBanners(response.data || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  };

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file) {
      if (!validateFile(file)) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only JPG, JPEG, and PNG files are allowed.",
        });
        return;
      }

      setFormData(prev => ({ ...prev, banner: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      banner: null,
      title: false,
      titleText: '',
      subtitle: false,
      subtitleText: '',
    });
    setImagePreview(null);
  };

  // Handle title toggle - clear text when disabled
  const handleTitleToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      title: checked,
      titleText: checked ? prev.titleText : ''
    }));
  };

  // Handle subtitle toggle - clear text when disabled
  const handleSubtitleToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subtitle: checked,
      subtitleText: checked ? prev.subtitleText : ''
    }));
  };

  const handleCreate = async () => {
    if (!formData.banner) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image",
      });
      return;
    }

    // Validate title and subtitle text when toggles are enabled
    if (formData.title && (!formData.titleText || formData.titleText.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title text is required when title is enabled",
      });
      return;
    }

    if (formData.subtitle && (!formData.subtitleText || formData.subtitleText.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Subtitle text is required when subtitle is enabled",
      });
      return;
    }

    const data = new FormData();
    data.append('banner', formData.banner);
    data.append('title', formData.title ? 'true' : 'false');
    if (formData.title && formData.titleText) {
      data.append('titleText', formData.titleText);
    }
    data.append('subtitle', formData.subtitle ? 'true' : 'false');
    if (formData.subtitle && formData.subtitleText) {
      data.append('subtitleText', formData.subtitleText);
    }
    data.append('isActive', 'true'); // Always active by default

    try {
      await apiHandler({
        method: 'POST',
        url: '/api/v1/banners',
        data,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      toast({
        title: "Success",
        description: "Banner created successfully",
          variant:"success",
      });

      setCreateModalOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Failed to create banner:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedBanner) return;

    // Validate title and subtitle text when toggles are enabled
    if (formData.title && (!formData.titleText || formData.titleText.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title text is required when title is enabled",
      });
      return;
    }

    if (formData.subtitle && (!formData.subtitleText || formData.subtitleText.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Subtitle text is required when subtitle is enabled",
      });
      return;
    }

    const data = new FormData();
    if (formData.banner) {
      data.append('banner', formData.banner);
    }
    data.append('title', formData.title ? 'true' : 'false');
    if (formData.title && formData.titleText) {
      data.append('titleText', formData.titleText);
    }
    data.append('subtitle', formData.subtitle ? 'true' : 'false');
    if (formData.subtitle && formData.subtitleText) {
      data.append('subtitleText', formData.subtitleText);
    }
    data.append('isActive', 'true'); // Keep active

    try {
      await apiHandler({
        method: 'PUT',
        url: `/api/v1/banners/${selectedBanner.id}`,
        data,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      toast({
        title: "Success",
        description: "Banner updated successfully",
          variant:"success",
      });

      setEditModalOpen(false);
      resetForm();
      setSelectedBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Failed to update banner:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;

    try {
      await apiHandler({
        method: 'DELETE',
        url: `/api/v1/banners/${selectedBanner.id}/permanent`,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      toast({
        title: "Success",
          variant:"success",
        description: "Banner permanently deleted successfully",
      });

      setDeleteModalOpen(false);
      setSelectedBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const openEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      banner: null,
      title: banner.title,
      titleText: banner.titleText || '',
      subtitle: banner.subtitle,
      subtitleText: banner.subtitleText || '',
    });
    setImagePreview(null);
    setEditModalOpen(true);
  };

  const openViewModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setViewModalOpen(true);
  };

  const openDeleteModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banner Management</h1>
          <p className="text-muted-foreground">Manage your website banners</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setCreateModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Banner</DialogTitle>
              <DialogDescription>
                Upload an image and configure your banner settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Banner Image *</Label>
                <div className="mt-2">
                  <Dropzone
                    accept={{
                      'image/jpeg': ['.jpg', '.jpeg'],
                      'image/png': ['.png'],
                    }}
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onDrop={handleFileUpload}
                    onError={(error) => {
                      toast({
                        variant: "destructive",
                        title: "Upload Error",
                        description: error.message,
                      });
                    }}
                    className="h-32"
                  >
                    {imagePreview ? (
                      <div className="w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <DropzoneEmptyState />
                    )}
                  </Dropzone>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="title"
                  checked={formData.title}
                  onCheckedChange={handleTitleToggle}
                />
                <Label htmlFor="title">Has Title</Label>
              </div>

              <div>
                <Label htmlFor="titleText">Title Text</Label>
                <Input
                  id="titleText"
                  value={formData.titleText}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, titleText: e.target.value }))
                  }
                  placeholder="Enter banner title"
                  className="mt-1"
                  disabled={!formData.title}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="subtitle"
                  checked={formData.subtitle}
                  onCheckedChange={handleSubtitleToggle}
                />
                <Label htmlFor="subtitle">Has Subtitle</Label>
              </div>

              <div>
                <Label htmlFor="subtitleText">Subtitle Text</Label>
                <Input
                  id="subtitleText"
                  value={formData.subtitleText}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, subtitleText: e.target.value }))
                  }
                  placeholder="Enter banner subtitle"
                  className="mt-1"
                  disabled={!formData.subtitle}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={banner.banner}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {banner.title && banner.titleText && (
                    <h3 className="font-semibold truncate">{banner.titleText}</h3>
                  )}
                  {banner.subtitle && banner.subtitleText && (
                    <p className="text-sm text-muted-foreground truncate">
                      {banner.subtitleText}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewModal(banner)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(banner)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteModal(banner)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Banner Details</DialogTitle>
          </DialogHeader>
          {selectedBanner && (
            <div className="space-y-4">
              <img
                src={selectedBanner.banner}
                alt="Banner"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="text-sm">
                    <Badge variant={selectedBanner.isActive ? "default" : "secondary"}>
                      {selectedBanner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Has Title</Label>
                  <div className="text-sm">{selectedBanner.title ? "Yes" : "No"}</div>
                </div>
                {selectedBanner.title && selectedBanner.titleText && (
                  <div className="col-span-2">
                    <Label>Title Text</Label>
                    <div className="text-sm">{selectedBanner.titleText}</div>
                  </div>
                )}
                <div>
                  <Label>Has Subtitle</Label>
                  <div className="text-sm">{selectedBanner.subtitle ? "Yes" : "No"}</div>
                </div>
                {selectedBanner.subtitle && selectedBanner.subtitleText && (
                  <div className="col-span-2">
                    <Label>Subtitle Text</Label>
                    <div className="text-sm">{selectedBanner.subtitleText}</div>
                  </div>
                )}
                <div>
                  <Label>Created</Label>
                  <div className="text-sm">{new Date(selectedBanner.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Updated</Label>
                  <div className="text-sm">{new Date(selectedBanner.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>
              Update your banner settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Banner Image (optional)</Label>
              <div className="mt-2">
                <Dropzone
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                  }}
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onDrop={handleFileUpload}
                  onError={(error) => {
                    toast({
                      variant: "destructive",
                      title: "Upload Error",
                      description: error.message,
                    });
                  }}
                  className="h-32"
                >
                  {imagePreview ? (
                    <div className="w-full h-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : selectedBanner ? (
                    <div className="w-full h-full">
                      <img
                        src={selectedBanner.banner}
                        alt="Current banner"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <DropzoneEmptyState />
                  )}
                </Dropzone>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-title"
                checked={formData.title}
                onCheckedChange={handleTitleToggle}
              />
              <Label htmlFor="edit-title">Has Title</Label>
            </div>

            <div>
              <Label htmlFor="edit-titleText">Title Text</Label>
              <Input
                id="edit-titleText"
                value={formData.titleText}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, titleText: e.target.value }))
                }
                placeholder="Enter banner title"
                className="mt-1"
                disabled={!formData.title}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-subtitle"
                checked={formData.subtitle}
                onCheckedChange={handleSubtitleToggle}
              />
              <Label htmlFor="edit-subtitle">Has Subtitle</Label>
            </div>

            <div>
              <Label htmlFor="edit-subtitleText">Subtitle Text</Label>
              <Input
                id="edit-subtitleText"
                value={formData.subtitleText}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, subtitleText: e.target.value }))
                }
                placeholder="Enter banner subtitle"
                className="mt-1"
                disabled={!formData.subtitle}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Update Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the banner from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannerPage;