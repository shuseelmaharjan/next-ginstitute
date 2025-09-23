import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Department } from "@/app/services/departmentService";
import { Faculty, facultyService } from "@/app/services/facultyService";

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSubmit: (facultyId: number, departmentName: string) => Promise<void>;
  isLoading?: boolean;
}

export function DepartmentFormModal({
  open,
  onOpenChange,
  department,
  onSubmit,
  isLoading = false,
}: DepartmentFormModalProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [facultyId, setFacultyId] = useState<string>("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [errors, setErrors] = useState<{ departmentName?: string; facultyId?: string }>({});

  const isEditing = !!department;

  // Load faculties on component mount
  useEffect(() => {
    const loadFaculties = async () => {
      setFacultiesLoading(true);
      try {
        const data = await facultyService.getAllFaculties();
        // Only show active faculties for selection
        setFaculties(data.filter(f => f.isActive));
      } catch (error) {
        console.error("Failed to load faculties:", error);
      } finally {
        setFacultiesLoading(false);
      }
    };

    if (open) {
      loadFaculties();
    }
  }, [open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (department) {
        setDepartmentName(department.departmentName);
        setFacultyId(department.facultyId.toString());
      } else {
        setDepartmentName("");
        setFacultyId("");
      }
      setErrors({});
    }
  }, [open, department]);

  // Debug effect to check values
  useEffect(() => {
    if (facultyId && faculties.length > 0) {
      const selectedFaculty = faculties.find(f => f.id.toString() === facultyId);
      console.log("Selected faculty:", {
        facultyId,
        selectedFaculty: selectedFaculty?.facultyName,
        allFaculties: faculties.map(f => ({ id: f.id, name: f.facultyName }))
      });
    }
  }, [facultyId, faculties]);

  const validateForm = (): boolean => {
    const newErrors: { departmentName?: string; facultyId?: string } = {};

    if (!departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (departmentName.trim().length < 2) {
      newErrors.departmentName = "Department name must be at least 2 characters";
    } else if (departmentName.trim().length > 100) {
      newErrors.departmentName = "Department name must be less than 100 characters";
    }

    if (!facultyId) {
      newErrors.facultyId = "Faculty selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      faculties.find(f => f.id.toString() === facultyId);

      await onSubmit(parseInt(facultyId), departmentName.trim());
      setDepartmentName("");
      setFacultyId("");
      setErrors({});
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    setDepartmentName("");
    setFacultyId("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the department information below."
                : "Enter the details for the new department."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Faculty Selection - Only show for new departments */}
            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="faculty">Faculty *</Label>
                <Select
                  value={facultyId}
                  onValueChange={setFacultyId}
                  disabled={facultiesLoading || isLoading}
                >
                  <SelectTrigger id="faculty">
                    <SelectValue
                      placeholder={facultiesLoading ? "Loading faculties..." : "Select faculty"}
                    >
                      {facultyId && faculties.length > 0
                        ? faculties.find(f => f.id.toString() === facultyId)?.facultyName || facultyId
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.facultyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.facultyId && (
                  <span className="text-sm text-red-500">{errors.facultyId}</span>
                )}
              </div>
            )}

            {/* Show current faculty for editing */}
            {isEditing && department && (
              <div className="grid gap-2">
                <Label>Faculty</Label>
                <div className="p-2 bg-gray-50 rounded-md text-sm">
                  {department.faculty?.facultyName || `Faculty ID: ${department.facultyId}`}
                </div>
              </div>
            )}

            {/* Department Name */}
            <div className="grid gap-2">
              <Label htmlFor="departmentName">Department Name *</Label>
              <Input
                id="departmentName"
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                disabled={isLoading}
                className={errors.departmentName ? "border-red-500" : ""}
              />
              {errors.departmentName && (
                <span className="text-sm text-red-500">{errors.departmentName}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || facultiesLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Department" : "Create Department"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}