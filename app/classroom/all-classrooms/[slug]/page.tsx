"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/hooks/use-toast";

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

  // Generate sheet state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<string>("billing");
  const [selectedSectionGen, setSelectedSectionGen] = useState<string>("all");
  const [billingMonth, setBillingMonth] = useState<string>("");
  const [billingPriority, setBillingPriority] = useState<string>("all");
  const [examination, setExamination] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([]);

  // Fetch students data
  const fetchStudents = useCallback(async (sectionId?: string) => {
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
    } catch (err: unknown) {
      console.error("Error fetching students:", err);
      const message = (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') ? (err as any).message : 'Failed to fetch students data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

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
  }, [classId, fetchStudents]);

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

  // Generate download helper
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    // validate common
    if (!generateType) {
      toast({ title: "Validation", description: "Please select a generate option", variant: "destructive" });
      return;
    }

    if (!selectedSectionGen) {
      toast({ title: "Validation", description: "Please select a section", variant: "destructive" });
      return;
    }

    // type specific validation
    if (generateType === "billing") {
      if (!billingMonth) {
        toast({ title: "Validation", description: "Please select a month for billing", variant: "destructive" });
        return;
      }
    }

    if (generateType === "admitcard") {
      if (!examination.trim()) {
        toast({ title: "Validation", description: "Please provide examination name", variant: "destructive" });
        return;
      }
    }

    // Build payload
    const payload: Record<string, unknown> = {
      section: selectedSectionGen === "all" ? "all" : selectedSectionGen,
    };

    let url = "";

    try {
      if (generateType === "billing") {
        url = "/api/v1/generate/billing";
        Object.assign(payload, { month: billingMonth, priority: billingPriority });
      } else if (generateType === "admitcard") {
        url = "/api/v1/generate/admitcard";
        Object.assign(payload, { examination });
      } else if (generateType === "idcard") {
        url = "/api/v1/generate/idcard";
      } else if (generateType === "report") {
        url = "/api/v1/generate/report";
      } else {
        toast({ title: "Validation", description: "Unsupported generate option", variant: "destructive" });
        return;
      }

      // Send request expecting blob
      const response = await apiHandler<Blob>({ url, method: "POST", data: payload, responseType: 'blob' });
      if (!response.success) {
        toast({ title: "Error", description: response.message || "Failed to generate file", variant: "destructive" });
        return;
      }

      const blob = response.data as unknown as Blob;
      const filename = `${generateType}-${selectedSectionGen}-${Date.now()}.pdf`;
      downloadBlob(blob, filename);
      toast({ title: "Download", description: "File downloaded successfully", variant: "success" });
      setGenerateOpen(false);
    } catch (err: unknown) {
      console.error(err);
      const message = (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') ? (err as any).message : 'Download failed';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
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
                <p className="text-muted-foreground">Manage all classrooms and sections here.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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

          {/* Generate Button */}
          <Sheet open={generateOpen} onOpenChange={setGenerateOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">Generate</Button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-sm w-full p-4">
              <SheetTitle className="mb-4">Generate</SheetTitle>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Generate</Label>
                  <Select value={generateType} onValueChange={setGenerateType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="admitcard">Admit Card</SelectItem>
                      <SelectItem value="idcard">ID Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2">Select Section</Label>
                  <Select value={selectedSectionGen} onValueChange={setSelectedSectionGen}>
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

                {/* Billing specific options */}
                {generateType === "billing" && (
                  <>
                    <div>
                      <Label className="mb-2">Month</Label>
                      <Select value={billingMonth} onValueChange={setBillingMonth}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Asoj', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
                          ].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2">Priority</Label>
                      <Select value={billingPriority} onValueChange={setBillingPriority}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="due">Due</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Admit card specific */}
                {generateType === "admitcard" && (
                  <>
                    <div>
                      <Label className="mb-2">Examination</Label>
                      <Input value={examination} onChange={(e) => setExamination(e.target.value)} placeholder="Examination name" />
                    </div>
                  </>
                )}

                {/* ID card - no extra fields */}

                <div className="flex items-center gap-2">
                  <Button onClick={handleDownload} className="w-full">Download</Button>
                  <Button variant="outline" onClick={() => setGenerateOpen(false)} className="w-full">Cancel</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
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
