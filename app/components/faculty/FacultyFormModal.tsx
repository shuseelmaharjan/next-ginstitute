"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Faculty } from "@/app/services/facultyService";

interface FacultyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty?: Faculty | null;
  onSubmit: (facultyName: string) => Promise<void>;
  isLoading: boolean;
}

export function FacultyFormModal({
  open,
  onOpenChange,
  faculty,
  onSubmit,
  isLoading,
}: FacultyFormModalProps) {
  const [facultyName, setFacultyName] = useState(faculty?.facultyName || "");
  const [errors, setErrors] = useState<string[]>([]);

  const isEdit = !!faculty;

  // Reset form when faculty changes
  useEffect(() => {
    if (faculty) {
      setFacultyName(faculty.facultyName);
    } else {
      setFacultyName("");
    }
    setErrors([]);
  }, [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    if (!facultyName.trim()) {
      validationErrors.push("Faculty name is required");
    }
    if (facultyName.trim().length < 2) {
      validationErrors.push("Faculty name must be at least 2 characters");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(facultyName.trim());
      setFacultyName("");
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    setFacultyName(faculty?.facultyName || "");
    setErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Faculty" : "Add New Faculty"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the faculty name. Click save when you're done."
              : "Add a new faculty to the system. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="facultyName" className="text-right">
                Name
              </Label>
              <Input
                id="facultyName"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="col-span-3"
                placeholder="Enter faculty name"
                disabled={isLoading}
              />
            </div>
            {errors.length > 0 && (
              <div className="col-span-4 text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Faculty"
                : "Create Faculty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}