"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/hooks/use-toast";
import RichTextEditor from "@/app/components/RichTextEditor";
import apiHandler from "@/app/api/apiHandler";
import { formatDate } from "@/utils/formatDate";

interface PrincipalMessage {
  id: number;
  principalName: string;
  message: string;
  profilePicture: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  createdByUser?: {
    id: number;
    fullName: string;
  };
  updatedByUser?: {
    id: number;
    fullName: string;
  } | null;
}

interface FormData {
  principalName: string;
  message: string;
  profilePicture: File | null;
}

const PrincipalMessagePage = () => {
  const [principalMessage, setPrincipalMessage] = useState<PrincipalMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    principalName: '',
    message: '',
    profilePicture: null,
  });

  useEffect(() => {
    fetchPrincipalMessage();
  }, []);

  const fetchPrincipalMessage = async () => {
    setLoading(true);
    try {
      const response = await apiHandler({
        method: 'GET',
        url: '/api/v1/principal-message',
        onError: (message) => {
          console.error('Failed to fetch:', message);
        }
      });

      if (response.success && response.data) {
        setPrincipalMessage(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch principal message:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Only JPG, JPEG, PNG, and WEBP files are allowed.",
      });
      return false;
    }
    return true;
  };

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file) {
      if (!validateFile(file)) return;
      setFormData(prev => ({ ...prev, profilePicture: file }));
    }
  };

  const resetForm = () => {
    setFormData({
      principalName: '',
      message: '',
      profilePicture: null,
    });
  };

  const validateForm = (requireImage: boolean = true): boolean => {
    if (!formData.principalName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Principal name is required",
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

    if (requireImage && !formData.profilePicture) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Profile picture is required",
      });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm(true)) return;
    if (!formData.profilePicture) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('principalName', formData.principalName);
      data.append('message', formData.message);
      data.append('profilePicture', formData.profilePicture);

      const response = await apiHandler({
        method: 'POST',
        url: '/api/v1/principal-message',
        data,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Principal message created successfully",
            variant: "success",
        });

        setAddModalOpen(false);
        resetForm();
        fetchPrincipalMessage();
      }
    } catch (error: unknown) {
      console.error('Failed to create:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!principalMessage) return;

    if (!formData.principalName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Principal name is required",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Message is required",
      });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('principalName', formData.principalName);
      data.append('message', formData.message);

      if (formData.profilePicture) {
        data.append('profilePicture', formData.profilePicture);
      }

      const response = await apiHandler({
        method: 'PUT',
        url: `/api/v1/principal-message/${principalMessage.id}`,
        data,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Principal message updated successfully",
            variant: "success",
        });

        setEditModalOpen(false);
        resetForm();
        fetchPrincipalMessage();
      }
    } catch (error: unknown) {
      console.error('Failed to update:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!principalMessage) return;

    setLoading(true);
    try {
      const response = await apiHandler({
        method: 'DELETE',
        url: `/api/v1/principal-message/${principalMessage.id}`,
        onError: (message) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Principal message deleted successfully",
            variant: "success",
        });

        setDeleteModalOpen(false);
        setPrincipalMessage(null);
      }
    } catch (error: unknown) {
      console.error('Failed to delete:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!principalMessage) return;
    setFormData({
      principalName: principalMessage.principalName,
      message: principalMessage.message,
      profilePicture: null,
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold">Principal Message</h1>
              <p className="text-muted-foreground">Manage principal messages here.</p>
          </div>
        {!principalMessage && (
          <Button onClick={() => setAddModalOpen(true)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Principal Message
          </Button>
        )}
        {principalMessage && (
          <Button onClick={openEditModal} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Update Principal Message
          </Button>
        )}
      </div>

        <div className="border-1 p-4 rounded-md shadow grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">

        {loading ? (
          <div className="flex justify-center items-center h-32 col-span-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
      ) : principalMessage ? (
        <Card className="overflow-hidden p-0 transition-shadow border-none shadow-none">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                <Image
                  src={principalMessage.profilePicture}
                  alt="Principal"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{principalMessage.principalName}</h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: principalMessage.message }}
                />
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(principalMessage.createdAt)}
                    {principalMessage.createdByUser && (
                      <> by {principalMessage.createdByUser.fullName}</>
                    )}
                  </div>
                    {principalMessage.updatedByUser &&(
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {formatDate(principalMessage.updatedAt)}
                    {principalMessage.updatedByUser && (
                      <> by {principalMessage.updatedByUser.fullName}</>
                    )}
                  </div>
                        )}
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="destructive"
                  onClick={openDeleteModal}
                  size="sm"
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-12 hover:shadow-none border-none shadow-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-4">No principal message found</p>
            <p className="text-sm">Click &quot;Add Principal Message&quot; to create one</p>
          </div>
        </Card>
      )}
        </div>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Principal Message</DialogTitle>
            <DialogDescription>
              Create a new principal message for your institute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-principal-name">Principal Name *</Label>
              <Input
                id="add-principal-name"
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                placeholder="Enter principal's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-message">Message *</Label>
              <RichTextEditor
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                placeholder="Enter principal's message..."
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Picture *</Label>
              <Dropzone
                src={formData.profilePicture ? [formData.profilePicture] : undefined}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp']
                }}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                onDrop={handleFileUpload}
                className="h-48"
              >
                <DropzoneContent>
                  {formData.profilePicture && (
                    <div className="relative w-full h-44">
                      <Image
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Preview"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  )}
                </DropzoneContent>
                <DropzoneEmptyState className="p-8" />
              </Dropzone>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                resetForm();
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Principal Message</DialogTitle>
            <DialogDescription>
              Update the principal message and profile picture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-principal-name">Principal Name *</Label>
              <Input
                id="edit-principal-name"
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                placeholder="Enter principal's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message *</Label>
              <RichTextEditor
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                placeholder="Enter principal's message..."
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Picture (Optional - leave empty to keep current)</Label>
              <Dropzone
                src={formData.profilePicture ? [formData.profilePicture] : undefined}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp']
                }}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                onDrop={handleFileUpload}
                className="h-48"
              >
                <DropzoneContent>
                  {formData.profilePicture ? (
                    <div className="relative w-full h-44">
                      <Image
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Preview"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  ) : principalMessage?.profilePicture ? (
                    <div className="relative w-full h-44">
                      <Image
                        src={principalMessage.profilePicture}
                        alt="Current"
                        fill
                        className="object-contain rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm">
                        Current Image - Click to replace
                      </div>
                    </div>
                  ) : null}
                </DropzoneContent>
                <DropzoneEmptyState className="p-8" />
              </Dropzone>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                resetForm();
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the principal message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PrincipalMessagePage;

