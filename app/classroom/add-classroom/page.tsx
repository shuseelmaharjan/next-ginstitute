"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import apiHandler from "@/app/api/apiHandler";
import { useIsMobile } from "@/hooks/use-mobile";

interface Faculty {
  id: string | number;
  facultyName: string;
}
interface Department {
  id: string | number;
  departmentName: string;
}

export default function AddClassroomPage() {
  const router = useRouter();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [classNameError, setClassNameError] = useState("");

  useEffect(() => {
    apiHandler({
      url: "/api/v1/faculty",
      method: "GET",
    }).then((res) => {
      if (res.success) setFaculties(res.data);
      else toast({ title: "Error", description: res.message, variant: "destructive" });
    });
  }, []);

  useEffect(() => {
    if (!selectedFaculty || selectedFaculty === "_all_faculties") return setDepartments([]);
    apiHandler({
      url: `/api/v1/departmentsfaculty/${selectedFaculty}`,
      method: "GET",
    }).then((res) => {
      if (res.success) setDepartments(res.data);
      else toast({ title: "Error", description: res.message, variant: "destructive" });
    });
  }, [selectedFaculty]);

  const validateClassName = (value: string) => {
    if (!value.trim()) return "Class name is required.";
    if (value.length < 2) return "Class name must be at least 2 characters.";
    if (value.length > 50) return "Class name must be less than 50 characters.";
    if (!/^[a-zA-Z0-9\s-]+$/.test(value)) return "Class name can only contain letters, numbers, spaces, and hyphens.";
    return "";
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(e.target.value);
    setClassNameError(validateClassName(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateClassName(className);
    setClassNameError(error);
    if (error) return;
    setLoading(true);
    try {
      const res = await apiHandler({
        url: "/api/v1/classes",
        method: "POST",
        data: {
          className,
          faculty_id: Number(selectedFaculty),
          department_id: Number(selectedDepartment),
        }
      });
      if (res.success) {
        toast({ title: "Success", description: res.message, variant:"success" });
        router.push("/classroom/all-classrooms");
      } else {
        toast({ title: "Error", description: res.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-4">
        <Toaster />
          <div>
          <h2 className="text-2xl font-bold tracking-tight">
                Add New Classroom
          </h2>
              <p>
                  Please fill out the form below to add a new classroom.
              </p>
          </div>
          <div className="w-full mx-auto p-4 bg-white rounded-md mt-8 border-1 shadow">
              <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                      <h2 className="text-xl font-bold">Add Classroom</h2>
                  </div>
                  <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-3 gap-4 mb-4"}>
                      <div>
                          <Input
                              placeholder="Enter class name"
                              value={className}
                              onChange={handleClassNameChange}
                              required
                              className={classNameError ? "border-red-500" : ""}
                          />
                          {classNameError && <p className="text-xs text-red-500 mt-1">{classNameError}</p>}
                      </div>
                      <div>
                          <Select
                              value={selectedFaculty || undefined}
                              onValueChange={setSelectedFaculty}
                              required
                          >
                              <SelectTrigger className="w-full">{selectedFaculty ? faculties.find(f => String(f.id) === selectedFaculty)?.facultyName : "Select Faculty"}</SelectTrigger>
                              <SelectContent>
                                  {faculties.map(f => (
                                      <SelectItem key={f.id} value={String(f.id)}>{f.facultyName}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Select
                              value={selectedDepartment || undefined}
                              onValueChange={setSelectedDepartment}
                              required
                              disabled={!selectedFaculty}
                          >
                              <SelectTrigger className="w-full">{selectedDepartment ? departments.find(d => String(d.id) === selectedDepartment)?.departmentName : "Select Department"}</SelectTrigger>
                              <SelectContent>
                                  {departments.map(d => (
                                      <SelectItem key={d.id} value={String(d.id)}>{d.departmentName}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div className={isMobile ? "mt-4" : "flex justify-end mt-4"}>
                      <Button type="submit" disabled={loading || !className || !selectedFaculty || !selectedDepartment || !!classNameError} className="w-full md:w-auto cursor-pointer">
                          {loading ? "Creating..." : "Create Classroom"}
                      </Button>
                  </div>
                  <Toaster />
              </form>
          </div>

      </div>
  );
}
