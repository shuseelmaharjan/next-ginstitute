"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import apiHandler from "@/app/api/apiHandler";
import Image from "next/image";
import { Star, StarOff } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {formatDuration} from "@/utils/formatDuration";
import { MoreVertical } from "lucide-react";

interface Course {
  id: number;
  title: string;
  duration: number;
  image: string;
  popular: boolean;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedByUser?: {
    firstName: string;
    lastName: string;
  } | null;
  department?: {
    departmentName: string;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
  cost?: number | null;
  currency?: string | null;
}

interface Faculty {
  id: number;
  facultyName: string;
}

interface Department {
  id: number;
  departmentName: string;
}

export default function AllCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all courses on mount
  useEffect(() => {
    setLoading(true);
    apiHandler({ url: "/api/v1/courses-with-costs", method: "GET" })
      .then((res) => setCourses(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  // Fetch faculties for filter
  useEffect(() => {
      apiHandler({ url: "/api/v1/faculty", method: "GET" })
      .then((res) => setFaculties(res.data || []));
  }, []);

  // Fetch departments when faculty is selected
  useEffect(() => {
    if (!selectedFaculty) return;
      apiHandler({ url: `/api/v1/departmentsfaculty/${selectedFaculty}`, method: "GET" })
      .then((res) => setDepartments(res.data || []));
  }, [selectedFaculty]);

  // Filter courses by department
  const handleFilter = () => {
    if (!selectedDepartment) return;
    setLoading(true);
      apiHandler({ url: `/api/v1/courses/department/${selectedDepartment}`, method: "GET" })
      .then((res) => setCourses(res.data || []))
      .finally(() => setLoading(false));
    setFilterOpen(false);
  };

  const handleTogglePopular = async (courseId: number) => {
    try {
      const res = await apiHandler({
        url: `/api/v1/courses/${courseId}/toggle-popular`,
        method: "PATCH",
      });
      if (res.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId ? { ...c, popular: !c.popular } : c
          )
        );
        // Optionally show a toast for success
      } else {
        // Optionally show a toast for error
      }
    } catch (err) {
      // Optionally show a toast for error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Courses Page</h2>
          <p className="text-muted-foreground">Browse and manage all courses. Use filters to narrow your search.</p>
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">Filter</Button>
          </SheetTrigger>
          <SheetContent side="right" className="max-w-sm w-full p-4">
            <SheetTitle className="mb-4">Filter Courses</SheetTitle>
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Select Faculty</label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.facultyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Select Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!selectedFaculty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.departmentName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleFilter} disabled={!selectedFaculty || !selectedDepartment} className="w-full mt-2 cursor-pointer">Apply Filter</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div>Loading...</div>
        ) : courses.length === 0 ? (
          <div>No courses found.</div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="flex flex-col h-full pt-0 pb-4 rounded-md">
              <div className="relative w-full h-60">
                <Image src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${course.image}`} alt={course.title} width={400} height={160} className="w-full h-60 object-cover rounded-t-md" />
                <button
                  type="button"
                  aria-label="Toggle popular"
                  onClick={() => handleTogglePopular(course.id)}
                  className="absolute top-2 right-2 z-20 p-2 bg-white/80 rounded-full shadow hover:bg-yellow-100"
                >
                  {course.popular ? (
                    <Star size={24} className="text-yellow-500" fill="#facc15" />
                  ) : (
                    <StarOff size={24} className="text-gray-400" />
                  )}
                </button>
              </div>
              <div className="px-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">{course.department?.departmentName}</div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex justify-between items-center text-sm">
                      <div><b>Duration:</b> {formatDuration(course.duration)}</div>
                      <div><b>Slug:</b> {course.slug}</div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div><b>Created By:</b> {course.createdByUser?.firstName} {course.createdByUser?.lastName}</div>
                      <div><b>Created At:</b> {formatDate(course.createdAt)}</div>
                    </div>
                    {course.updatedByUser && (
                      <div className="flex justify-between items-center text-sm">
                        <div><b>Updated By:</b> {course.updatedByUser.firstName} {course.updatedByUser.lastName}</div>
                        <div><b>Updated At:</b> {formatDate(course.updatedAt)}</div>
                      </div>
                    )}
                  </CardContent>
                </div>
                <CardFooter className="flex justify-between items-end pt-2 px-0">
                  {course.cost !== null && course.cost !== undefined ? (
                    <div>
                      <span className="font-semibold text-lg">{course.currency?.toUpperCase()} {course.cost}</span>
                    </div>
                  ) : (
                    <Button variant="outline">Add Cost</Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <span className="sr-only">Course Actions</span>
                          <MoreVertical/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Course</DropdownMenuItem>
                      <DropdownMenuItem>Edit Course</DropdownMenuItem>
                      <DropdownMenuItem>Update Cost</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete Course</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}