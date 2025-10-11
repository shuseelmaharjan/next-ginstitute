"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import apiHandler from "@/app/api/apiHandler";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Fetch students
  const fetchStudents = async (searchQuery = "", pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      let url = "";
      if (searchQuery) {
        url = `/api/v1/students/search-enrolled-with-enrollment-info?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=${PAGE_SIZE}`;
      } else {
        url = `/api/v1/students/enrolled-with-enrollment-info?page=${pageNum}&limit=${PAGE_SIZE}`;
      }
      const res = await apiHandler({ url, method: "GET" });
      if (res.success) {
        setStudents(res.data.students || []);
        setTotal(res.data.total || 0);
      } else {
        setStudents([]);
        setTotal(0);
        setError(res.message || "Failed to fetch students");
      }
    } catch (err: unknown) {
      setStudents([]);
      setTotal(0);
      setError("Failed to fetch students");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Search handler
  const handleSearch = () => {
    setPage(1);
    fetchStudents(search, 1);
  };

  // Pagination controls
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Enrolled Students</h2>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name, guardian, contact, or username"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} disabled={loading}>Search</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SN</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Guardian Name</TableHead>
              <TableHead>Guardian Contact</TableHead>
              <TableHead>Class Name</TableHead>
              <TableHead>Section Name</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">No record found</TableCell>
              </TableRow>
            ) : (
              students.map((student, idx) => {
                const enrollment = student.enrollments?.[0] || {};
                return (
                  <TableRow key={student.userId}>
                    <TableCell>{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profile ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${student.profile}` : undefined} alt={student.name} />
                        <AvatarFallback>{student.name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>{student.dateOfBirth}</TableCell>
                    <TableCell>{student.guardianName}</TableCell>
                    <TableCell>{student.guardianContact}</TableCell>
                    <TableCell>{enrollment.className || "-"}</TableCell>
                    <TableCell>{enrollment.sectionName || "-"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">View</Button>
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
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={handlePrev} disabled={page === 1}>Prev</Button>
          <span>Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={handleNext} disabled={page === totalPages}>Next</Button>
        </div>
      )}
      {error && <div className="text-destructive mt-2">{error}</div>}
    </div>
  );
}