"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import apiHandler from "@/app/api/apiHandler";
import { encryptNumber } from "@/utils/numberCrypto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PAGE_SIZE = 10;

interface Student {
  userId: number;
  name: string;
  username: string;
  dateOfBirth: string;
  profile: string;
  guardianName: string;
  guardianContact: string;
  enrollments: Array<{
    enrollmentId: number;
    departmentId: number;
    departmentName: string;
    courseId: number;
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
    enrollmentDate: string;
    totalFees: string;
    discount: string;
    discountType: string;
    netFees: string;
    remarks: string;
  }>;
}

interface Section {
  sectionId: number;
  sectionName: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    total: number;
    availableSections: Section[];
    filters: {
      classId: number;
      sectionId: number | null;
    };
  };
}

export default function ClassroomSlugPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.slug as string;

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([]);

  // Fetch students data
  const fetchStudents = async (sectionId?: string) => {
    try {
      setLoading(true);
      setError("");
      
      let url = `/api/v1/students/enrolled-by-class/${classId}`;
      if (sectionId) {
        url += `?sectionId=${sectionId}`;
      }

      const response = await apiHandler<ApiResponse>({
        url,
        method: "GET",
      });

      if (response.success) {
        setStudents(response.data.students);
        setAvailableSections(response.data.availableSections);
        setTotalStudents(response.data.students.length);
        // Reset to first page when data changes
        setPage(1);
      } else {
        setError("Failed to fetch students data");
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.message || "Failed to fetch students data");
    } finally {
      setLoading(false);
    }
  };

  // Update paginated students when page or students change
  useEffect(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedStudents(students.slice(startIndex, endIndex));
  }, [students, page]);

  // Initial fetch
  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  // Filter handlers
  const handleFilter = () => {
    fetchStudents(selectedSection === "all" ? undefined : selectedSection);
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedSection("all");
    fetchStudents();
    setFilterOpen(false);
  };

  // Pagination handlers
  const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
  
  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (!classId) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <div className="text-center text-red-500">Invalid class ID</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div>
              <h2 className="text-2xl font-bold tracking-tight">Classroom Students</h2>
                <p>Manage all classrooms and sections here.</p>
          </div>
        </div>
        
        {/* Filter Button */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">Filter</Button>
          </SheetTrigger>
          <SheetContent side="right" className="max-w-sm w-full p-4">
            <SheetTitle className="mb-4">Filter Students</SheetTitle>
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Select Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {availableSections.map((section) => (
                      <SelectItem key={section.sectionId} value={String(section.sectionId)}>
                        {section.sectionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Button onClick={handleFilter} className="w-full">
                  Apply Filter
                </Button>
                <Button onClick={handleClearFilter} variant="outline" className="w-full">
                  Clear Filter
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Students Table */}
      <div className="overflow-x-auto border-1 shadow rounded-lg p-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-black hover:bg-black/90 text-white">
              <TableHead className="font-bold text-white">SN</TableHead>
              <TableHead className="font-bold text-white">Profile</TableHead>
              <TableHead className="font-bold text-white">Name</TableHead>
              <TableHead className="font-bold text-white">Username</TableHead>
              <TableHead className="font-bold text-white">Date of Birth</TableHead>
              <TableHead className="font-bold text-white">Guardian Name</TableHead>
              <TableHead className="font-bold text-white">Guardian Contact</TableHead>
              <TableHead className="font-bold text-white">Class</TableHead>
              <TableHead className="font-bold text-white">Section</TableHead>
              <TableHead className="font-bold text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={10}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student, idx) => {
                const enrollment = student.enrollments?.[0] || {};
                return (
                  <TableRow key={student.userId}>
                    <TableCell>{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={student.profile || undefined} 
                          alt={student.name} 
                        />
                        <AvatarFallback>{student.name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>
                      {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{student.guardianName || "-"}</TableCell>
                    <TableCell>{student.guardianContact || "-"}</TableCell>
                    <TableCell>{enrollment.className || "-"}</TableCell>
                    <TableCell>{enrollment.sectionName || "-"}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/users/students/${encryptNumber(student.userId)}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} ({totalStudents} total students)
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePrev} 
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm">
              {page}
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleNext} 
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

