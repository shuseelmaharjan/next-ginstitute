"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
import { formatDate } from "@/utils/formatDate";

interface Testimonial {
  id: number;
  name: string;
  position: string;
  image: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: number;
    fullName: string;
  };
  updatedByUser?: {
    id: number;
    fullName: string;
  };
}

interface TestimonialFormData {
  name: string;
  position: string;
  message: string;
  image: File | null;
}

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>({
    name: '',
    position: '',
    message: '',
    image: null,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await apiHandler({
        method: 'GET',
        url: '/api/v1/testimonials/active',
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });
      setTestimonials(response.data || []);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  };

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file) {
      if (!validateFile(file)) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only JPG, JPEG, PNG, and WEBP files are allowed.",
        });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));

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
      name: '',
      position: '',
      message: '',
      image: null,
    });
    setImagePreview(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name is required",
      });
      return false;
    }

    if (!formData.position.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Position is required",
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Message is required",
      });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    if (!formData.image) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image",
      });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('position', formData.position);
    data.append('message', formData.message);
    data.append('image', formData.image);

    try {
      await apiHandler({
        method: 'POST',
        url: '/api/v1/testimonials',
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
        description: "Testimonial created successfully",
        variant: "success",
      });

      setCreateModalOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to create testimonial:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedTestimonial) return;
    if (!validateForm()) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('position', formData.position);
    data.append('message', formData.message);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      await apiHandler({
        method: 'PUT',
        url: `/api/v1/testimonials/${selectedTestimonial.id}`,
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
        description: "Testimonial updated successfully",
        variant: "success",
      });

      setEditModalOpen(false);
      resetForm();
      setSelectedTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to update testimonial:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTestimonial) return;

    try {
      await apiHandler({
        method: 'DELETE',
        url: `/api/v1/testimonials/${selectedTestimonial.id}/permanent`,
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
        variant: "success",
        description: "Testimonial permanently deleted successfully",
      });

      setDeleteModalOpen(false);
      setSelectedTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  };

  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      position: testimonial.position,
      message: testimonial.message,
      image: null,
    });
    setImagePreview(null);
    setEditModalOpen(true);
  };

  const openViewModal = async (testimonial: Testimonial) => {
    try {
      const response = await apiHandler({
        method: 'GET',
        url: `/api/v1/testimonials/${testimonial.id}`,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      if (response.data) {
        setSelectedTestimonial(response.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch testimonial details:', error);
    }
  };

  const openDeleteModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Testimonials Management</h1>
          <p className="text-muted-foreground">Manage testimonials from students and clients</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setCreateModalOpen(true); }} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Testimonial</DialogTitle>
              <DialogDescription>
                Add a new testimonial with person details and their feedback
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Profile Image *</Label>
                <div className="mt-2">
                  <Dropzone
                    accept={{
                      'image/jpeg': ['.jpg', '.jpeg'],
                      'image/png': ['.png'],
                      'image/webp': ['.webp'],
                    }}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024} // 5MB
                    onDrop={handleFileUpload}
                    onError={(error) => {
                      toast({
                        variant: "destructive",
                        title: "Upload Error",
                        description: error.message,
                      });
                    }}
                    className="h-48 cursor-pointer"
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          className="object-cover rounded-lg"
                          fill
                          priority
                        />
                      </div>
                    ) : (
                      <DropzoneEmptyState />
                    )}
                  </Dropzone>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter person's name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="e.g., Project Manager, Student"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData(prev => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Enter testimonial message"
                  className="mt-1 min-h-32"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleCreate} className="cursor-pointer">
                Create Testimonial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-1 p-4 rounded-md shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex justify-center items-center h-32 col-span-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="flex justify-center items-center h-32 col-span-full">
            <p className="text-muted-foreground">No testimonials found. Click <strong>Add Testimonial</strong> to create one.</p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                  <img
                    src={testimonial.image || '/default/user.jpg'}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default/user.jpg'; }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.position}</p>
                </div>
                <p className="text-sm text-center line-clamp-3 text-muted-foreground italic">
                  &ldquo;{testimonial.message}&rdquo;
                </p>
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openViewModal(testimonial)}
                    className="cursor-pointer rounded-md"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(testimonial)}
                    className="cursor-pointer rounded-md"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteModal(testimonial)}
                    className="cursor-pointer rounded-md"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* View Modal (Tailwind-only) */}
      {viewModalOpen && selectedTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewModalOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 overflow-auto max-h-[90vh] z-10"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Testimonial Details</h3>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-sm text-muted-foreground px-2 py-1 hover:underline"
                aria-label="Close dialog"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-6">
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 flex-shrink-0">
                  <img
                    src={selectedTestimonial.image || '/default/user.jpg'}
                    alt={selectedTestimonial.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default/user.jpg'; }}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Name</Label>
                    <div className="text-lg font-semibold">{selectedTestimonial.name}</div>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <div className="text-sm text-muted-foreground">{selectedTestimonial.position}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Testimonial Message</Label>
                <div className="text-sm mt-2 p-4 bg-muted rounded-lg italic">
                  "{selectedTestimonial.message}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div>
                    <Label>Created At</Label>
                    <div className="text-sm">{formatDate(selectedTestimonial.createdAt)}</div>
                  </div>
                  <div>
                    <Label>Created By</Label>
                    <div className="text-sm">{selectedTestimonial.createdByUser?.fullName || 'N/A'}</div>
                  </div>
                </div>
                {selectedTestimonial.updatedByUser && (
                  <div className="space-y-3">
                    <div>
                      <Label>Updated At</Label>
                      <div className="text-sm">{formatDate(selectedTestimonial.updatedAt)}</div>
                    </div>
                    <div>
                      <Label>Updated By</Label>
                      <div className="text-sm">{selectedTestimonial.updatedByUser.fullName}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>
              Update testimonial information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Profile Image (optional)</Label>
              <div className="mt-2">
                <Dropzone
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'image/webp': ['.webp'],
                  }}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024} // 5MB
                  onDrop={handleFileUpload}
                  onError={(error) => {
                    toast({
                      variant: "destructive",
                      title: "Upload Error",
                      description: error.message,
                    });
                  }}
                  className="h-48 cursor-pointer"
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover rounded-lg"
                        fill
                        priority
                      />
                    </div>
                  ) : selectedTestimonial ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedTestimonial.image}
                        alt="Current image"
                        className="object-cover rounded-lg"
                        fill
                        priority
                      />
                    </div>
                  ) : (
                    <DropzoneEmptyState />
                  )}
                </Dropzone>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter person's name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-position">Position *</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, position: e.target.value }))
                }
                placeholder="e.g., Project Manager, Student"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-message">Message *</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, message: e.target.value }))
                }
                placeholder="Enter testimonial message"
                className="mt-1 min-h-32"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleEdit} className="cursor-pointer">
              Update Testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the testimonial from {selectedTestimonial?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestimonialsPage;

