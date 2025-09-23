"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, GraduationCap, BookOpen, Plus, RefreshCw } from "lucide-react";
import { FacultyFormModal } from "@/app/components/faculty/FacultyFormModal";
import { FacultyList } from "@/app/components/faculty/FacultyList";
import { DepartmentFormModal } from "@/app/components/department/DepartmentFormModal";
import { DepartmentList } from "@/app/components/department/DepartmentList";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/hooks/use-toast";
import { facultyService, Faculty } from "@/app/services/facultyService";
import { departmentService, Department } from "@/app/services/departmentService";

export default function FacultyPage() {
  // Faculty states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [stats, setStats] = useState({
    totalFaculties: 0,
    activeFaculties: 0,
    inactiveFaculties: 0,
  });

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
  const [isDepartmentFormLoading, setIsDepartmentFormLoading] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentStats, setDepartmentStats] = useState({
    totalDepartments: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
  });

  // Fetch all faculties
  const fetchFaculties = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getAllFaculties();
      setFaculties(data);
      
      // Update stats
      const activeFaculties = data.filter(f => f.isActive).length;
      setStats({
        totalFaculties: data.length,
        activeFaculties,
        inactiveFaculties: data.length - activeFaculties,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch faculties",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load faculties on component mount
  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  // Handle form submission (create/update)
  const handleFormSubmit = async (facultyName: string) => {
    setIsFormLoading(true);
    try {
      if (editingFaculty) {
        // Update existing faculty
        await facultyService.updateFacultyName(editingFaculty.id, facultyName);
        toast({
          title: "Success",
          description: "Faculty updated successfully",
          variant: "success",
        });
      } else {
        // Create new faculty
        await facultyService.createFaculty(facultyName);
        toast({
          title: "Success",
          description: "Faculty created successfully",
          variant: "success",
        });
      }
      
      // Refresh the list
      await fetchFaculties();
      setIsModalOpen(false);
      setEditingFaculty(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle edit faculty
  const handleEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  // Handle status toggle (activate/deactivate)
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await facultyService.updateFacultyStatus(id, newStatus);
      toast({
        title: "Success",
        description: `Faculty ${newStatus ? 'activated' : 'deactivated'} successfully`,
        variant: "success",
      });
      
      // Refresh the list
      await fetchFaculties();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update faculty status",
        variant: "destructive",
      });
    }
  };

  // Handle add new faculty
  const handleAddNew = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setEditingFaculty(null);
    }
    setIsModalOpen(open);
  };

  // Department functions
  // Fetch all departments
  const fetchDepartments = useCallback(async () => {
    setIsDepartmentLoading(true);
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
      
      // Update department stats
      const activeDepartments = data.filter(d => d.isActive).length;
      setDepartmentStats({
        totalDepartments: data.length,
        activeDepartments,
        inactiveDepartments: data.length - activeDepartments,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setIsDepartmentLoading(false);
    }
  }, []);

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handle department form submission (create/update)
  const handleDepartmentFormSubmit = async (facultyId: number, departmentName: string) => {
    setIsDepartmentFormLoading(true);
    try {
      if (editingDepartment) {
        // Update existing department name
        await departmentService.updateDepartmentName(editingDepartment.id, departmentName);
        toast({
          title: "Success",
          description: "Department updated successfully",
          variant: "success",
        });
      } else {
        // Create new department
        await departmentService.createDepartment({ facultyId, departmentName });
        toast({
          title: "Success",
          description: "Department created successfully",
          variant: "success",
        });
      }
      
      // Refresh the list
      await fetchDepartments();
      setIsDepartmentModalOpen(false);
      setEditingDepartment(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsDepartmentFormLoading(false);
    }
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsDepartmentModalOpen(true);
  };

  // Handle department status toggle (activate/deactivate)
  const handleToggleDepartmentStatus = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await departmentService.updateDepartmentStatus(id, newStatus);
      toast({
        title: "Success",
        description: `Department ${newStatus ? 'activated' : 'deactivated'} successfully`,
        variant: "success",
      });
      
      // Refresh the list
      await fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update department status",
        variant: "destructive",
      });
    }
  };

  // Handle add new department
  const handleAddNewDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentModalOpen(true);
  };

  // Handle department modal close
  const handleDepartmentModalClose = (open: boolean) => {
    if (!open) {
      setEditingDepartment(null);
    }
    setIsDepartmentModalOpen(open);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty Management</h2>
          <p className="text-muted-foreground">
            Manage faculty settings and departments.
          </p>
        </div>

        <Separator />

        {/* Faculty Overview Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Faculty Overview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFaculties}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Faculties</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalFaculties}</p>
              <p className="text-sm text-muted-foreground">
                {stats.activeFaculties} active, {stats.inactiveFaculties} inactive
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                <span className="font-medium">Active Faculties</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activeFaculties}</p>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Inactive Faculties</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{stats.inactiveFaculties}</p>
              <p className="text-sm text-muted-foreground">Currently inactive</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Faculty Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Faculties</h3>
            <Button onClick={handleAddNew} disabled={isLoading} className="whitespace-nowrap cursor-pointer select-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </div>

          {isLoading && faculties.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading faculties...</p>
            </div>
          ) : (
            <FacultyList
              faculties={faculties}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              isLoading={isLoading}
            />
          )}
        </div>

        <Separator />

        {/* Department Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Department Overview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDepartments}
              disabled={isDepartmentLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isDepartmentLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Departments</span>
              </div>
              <p className="text-2xl font-bold">{departmentStats.totalDepartments}</p>
              <p className="text-sm text-muted-foreground">
                {departmentStats.activeDepartments} active, {departmentStats.inactiveDepartments} inactive
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span className="font-medium">Active Departments</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{departmentStats.activeDepartments}</p>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Inactive Departments</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{departmentStats.inactiveDepartments}</p>
              <p className="text-sm text-muted-foreground">Currently inactive</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Department List Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Departments</h3>
            <Button onClick={handleAddNewDepartment} disabled={isDepartmentLoading} className="whitespace-nowrap cursor-pointer select-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>

          {isDepartmentLoading && departments.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading departments...</p>
            </div>
          ) : (
            <DepartmentList
              departments={departments}
              onEdit={handleEditDepartment}
              onToggleStatus={handleToggleDepartmentStatus}
              isLoading={isDepartmentLoading}
            />
          )}
        </div>
      </div>

      {/* Faculty Form Modal */}
      <FacultyFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        faculty={editingFaculty}
        onSubmit={handleFormSubmit}
        isLoading={isFormLoading}
      />

      {/* Department Form Modal */}
      <DepartmentFormModal
        open={isDepartmentModalOpen}
        onOpenChange={handleDepartmentModalClose}
        department={editingDepartment}
        onSubmit={handleDepartmentFormSubmit}
        isLoading={isDepartmentFormLoading}
      />

      {/* Toast Notifications */}
      <Toaster />
    </>
  );
}