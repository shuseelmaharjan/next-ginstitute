"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Edit, Power, PowerOff } from "lucide-react";
import { Faculty } from "@/app/services/facultyService";

interface FacultyListProps {
  faculties: Faculty[];
  onEdit: (faculty: Faculty) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  isLoading: boolean;
}

export function FacultyList({
  faculties,
  onEdit,
  onToggleStatus,
  isLoading,
}: FacultyListProps) {
  if (faculties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No faculties found. Click "Add Faculty" to create your first faculty.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {faculties.map((faculty) => (
        <div key={faculty.id} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">{faculty.facultyName}</h4>
                <Badge
                  variant={faculty.isActive ? "default" : "secondary"}
                  className={
                    faculty.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {faculty.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {new Date(faculty.createdAt).toLocaleDateString()} •
                Updated: {new Date(faculty.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(faculty)}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(faculty.id, faculty.isActive)}
                disabled={isLoading}
                className={
                  faculty.isActive
                    ? "hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    : "hover:bg-green-50 hover:border-green-200 hover:text-green-600"
                }
              >
                {faculty.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}