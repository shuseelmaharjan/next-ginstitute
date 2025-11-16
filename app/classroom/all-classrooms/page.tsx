"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import apiHandler from "@/app/api/apiHandler";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { FaPencil, FaTrash } from "react-icons/fa6";

// Type definitions
interface Faculty {
    id: string | number;
    facultyName: string;
}
interface Department {
    id: string | number;
    departmentName: string;
}
interface Classroom {
    sectionsCount: string;
    id: string | number;
    className: string;
    faculty_id?: string | number;
    department_id?: string | number;
    faculty?: Faculty;
    department?: Department;
}
interface Section {
    id: number;
    class_id: number;
    sectionName: string;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string | null;
    isActive: boolean;
    class: { id: number; className: string };
}

export default function AllClassroomsPage() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [editClass, setEditClass] = useState<Classroom | null>(null);
    const [sectionsModalOpen, setSectionsModalOpen] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [sectionsError, setSectionsError] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
    const [removeSectionModalOpen, setRemoveSectionModalOpen] = useState(false);
    const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [sectionNameInput, setSectionNameInput] = useState("");
    const router = useRouter();

    useEffect(() => {
        apiHandler({ url: "/api/v1/faculty", method: "GET" }).then(res => {
            if (res.success) setFaculties(res.data);
        });
    }, []);


    useEffect(() => {
        if (!selectedFaculty) return setDepartments([]);
        apiHandler({ url: `/api/v1/departmentsfaculty/${selectedFaculty}`, method: "GET" }).then(res => {
            if (res.success) setDepartments(res.data);
        });
    }, [selectedFaculty]);

    const fetchClassrooms = () => {
        setSectionsLoading(true);
        apiHandler({
            url: `/api/v1/classes?page=${page}&limit=10`,
            method: "GET",
            data: undefined,
        }).then(res => {
            if (res.success) {
                let data = res.data as Classroom[];
                if (selectedFaculty && selectedFaculty !== "_all_faculties") data = data.filter((c: Classroom) => String(c.faculty_id) === selectedFaculty);
                if (selectedDepartment && selectedDepartment !== "_all_departments") data = data.filter((c: Classroom) => String(c.department_id) === selectedDepartment);
                // Natural sort by class number if present
                data = [...data].sort((a: Classroom, b: Classroom) => {
                    const numA = a.className.match(/\d+/);
                    const numB = b.className.match(/\d+/);
                    if (numA && numB) {
                        return sortAsc ? (parseInt(numA[0]) - parseInt(numB[0])) : (parseInt(numB[0]) - parseInt(numA[0]));
                    }
                    // Fallback to string comparison
                    return sortAsc ? a.className.localeCompare(b.className) : b.className.localeCompare(a.className);
                });
                setClassrooms(data);
                setTotal(data.length);
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
            setSectionsLoading(false);
        });
    };

    useEffect(() => {
        fetchClassrooms();
        // eslint-disable-next-line
    }, [selectedFaculty, selectedDepartment, sortAsc, page]);

    const handleDelete = async () => {
        try {
            const res = await apiHandler({
                url: `/api/v1/classes/${deleteId}`,
                method: "DELETE",
            });
            if (res.success) {
                toast({ title: "Success", description: res.message, variant:"success" });
                setDeleteId(null);
                fetchClassrooms();
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
        }
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await apiHandler({
                url: `/api/v1/classes/${editClass!.id}`,
                method: "PUT",
                data: {
                    className: editClass!.className,
                },
            });
            if (res.success) {
                toast({ title: "Success", description: res.message, variant: "success" });
                setEditClass(null);
                fetchClassrooms();
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Warning", description: "The classname already exist, please use different one." });
        }
    };

    // Fetch sections for a class
    const handleViewSections = async (classId: number) => {
        setSectionsLoading(true);
        setSectionsModalOpen(true);
        setSelectedClassId(classId);
        setSectionsError(null);
        try {
            const res = await apiHandler({ url: `/api/v1/sections/class/${classId}`, method: "GET" });
            if (res.success) {
                setSections(res.data);
            } else {
                setSectionsError(res.message || "Failed to fetch sections");
            }
        } catch {
            setSectionsError("Failed to fetch sections");
        }
        setSectionsLoading(false);
    };

    // Remove section
    const handleRemoveSection = async () => {
        if (!selectedSection) return;
        try {
            const res = await apiHandler({ url: `/api/v1/sections/${selectedSection.id}`, method: "DELETE" });
            if (res.success) {
                setSections(sections.filter(s => s.id !== selectedSection.id));
                toast({ title: "Success", description: "Section removed successfully", variant:"success" });
                setRemoveSectionModalOpen(false);
                setSelectedSection(null);
                // Update sectionsCount in classrooms table
                setClassrooms(prev => prev.map(cls =>
                    Number(cls.id) === selectedClassId
                        ? { ...cls, sectionsCount: String(Math.max((Number(cls.sectionsCount) || 1) - 1, 0)) }
                        : cls
                ));
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to remove section", variant: "destructive" });
        }
    };

    // Edit section
    const handleEditSection = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSection) return;
        try {
            const res = await apiHandler({
                url: `/api/v1/sections/${selectedSection.id}/name`,
                method: "PUT",
                data: { sectionName: sectionNameInput },
            });
            if (res.success) {
                setSections(sections.map(s => s.id === selectedSection.id ? { ...s, sectionName: sectionNameInput } : s));
                toast({ title: "Success", description: "Section updated successfully" });
                setEditSectionModalOpen(false);
                setSelectedSection(null);
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to update section", variant: "destructive" });
        }
    };

    // Add section
    const handleAddSection = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedClassId) return;
        try {
            const res = await apiHandler({
                url: `/api/v1/sections`,
                method: "POST",
                data: { class_id: selectedClassId, sectionName: sectionNameInput },
            });
            if (res.success) {
                setSections([...sections, res.data]);
                toast({ title: "Success", description: "Section added successfully" });
                setAddSectionModalOpen(false);
                setSectionNameInput("");
                setClassrooms(prev => prev.map(cls =>
                    Number(cls.id) === selectedClassId
                        ? { ...cls, sectionsCount: String((Number(cls.sectionsCount) || 0) + 1) }
                        : cls
                ));
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "This name is already exist, please use another one.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">All Classrooms</h2>
                    <p>Manage all classrooms and sections here.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                        <SelectContent>
                            <SelectItem value="_all_faculties">All Faculties</SelectItem>
                            {faculties.map((f: Faculty) => (
                                <SelectItem key={f.id} value={String(f.id)}>{f.facultyName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!selectedFaculty}>
                        <SelectContent>
                            <SelectItem value="_all_departments">All Departments</SelectItem>
                            {departments.map((d: Department) => (
                                <SelectItem key={d.id} value={String(d.id)}>{d.departmentName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button className="cursor-pointer" onClick={() => setSortAsc(s => !s)}>{sortAsc ? "Sort A-Z" : "Sort Z-A"}</Button>
                </div>

            </div>
            <div className="border-1 shadow rounded-lg p-4">
                <Table className="w-full text-sm">
                    <TableHeader>
                        <TableRow className="bg-black hover:bg-black/90 text-white">
                            <TableCell className="font-bold">S.N.</TableCell>
                            <TableCell className="font-bold">Class</TableCell>
                            <TableCell className="font-bold">Faculty</TableCell>
                            <TableCell className="font-bold">Department</TableCell>
                            <TableCell className="font-bold">Assiocated Section</TableCell>
                            <TableCell className="font-bold">Actions</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classrooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No records found.</TableCell>
                            </TableRow>
                        ) : (
                            classrooms.slice((page-1)*10, page*10).map((c: Classroom, idx: number) => (
                                <TableRow key={c.id} >
                                    <TableCell>{(page-1)*10 + idx + 1}</TableCell>
                                    <TableCell onClick={() => router.push(`/classroom/all-classrooms/${c.id}`)} className="cursor-pointer">{c.className}</TableCell>
                                    <TableCell>{c.faculty?.facultyName || "-"}</TableCell>
                                    <TableCell>{c.department?.departmentName || "-"}</TableCell>
                                    <TableCell>{c.sectionsCount || "-"}</TableCell>
                                    <TableCell className="space-x-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="p-0"><MoreVertical size={20} /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">

                                                <DropdownMenuItem onClick={() => router.push(`/classroom/all-classrooms/${c.id}`)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditClass(c)}>Edit Classroom</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteId(c.id)}>Delete Classroom</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewSections(Number(c.id))}>View Sections</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setAddSectionModalOpen(true); setSelectedClassId(Number(c.id)); setSectionNameInput(""); }}>Add Section</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

            </div>
            <div className="flex justify-between items-center mt-4">
                <Button className="cursor-pointer" disabled={page === 1} onClick={() => setPage(page-1)}>Prev</Button>
                <span>Page {page} of {Math.ceil(total/10) || 1}</span>
                <Button className="cursor-pointer" disabled={page*10 >= total} onClick={() => setPage(page+1)}>Next</Button>
            </div>
            <Toaster />
            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <DialogContent>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <p>Are you sure you want to delete this classroom?</p>
                    <DialogFooter>
                        <Button variant="destructive" className="cursor-pointer select-none" onClick={handleDelete}>Delete</Button>
                        <Button variant="outline" className="cursor-pointer select-none" onClick={() => setDeleteId(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Modal */}
            <Dialog open={!!editClass} onOpenChange={v => !v && setEditClass(null)}>
                <DialogContent>
                    <DialogTitle>Edit Classroom</DialogTitle>
                    <form onSubmit={handleEdit} className="space-y-2">
                        <Input
                            value={editClass?.className || ""}
                            onChange={e => setEditClass(editClass ? { ...editClass, className: e.target.value } : null)}
                            required
                        />
                        <DialogFooter>
                            <Button type="submit" className="cursor-pointer">Update</Button>
                            <Button type="button" variant="outline" className="cursor-pointer select-none" onClick={() => setEditClass(null)}>Cancel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Sections Modal */}
            <Dialog open={sectionsModalOpen} onOpenChange={v => { setSectionsModalOpen(v); if (!v) { setSections([]); setSelectedClassId(null); } }}>
                <DialogContent>
                    <DialogTitle>Sections</DialogTitle>
                    {sectionsLoading ? (
                        <div className="py-4 text-center">Loading...</div>
                    ) : sectionsError ? (
                        <div className="py-4 text-red-500 text-center">{sectionsError}</div>
                    ) : (
                        <div className="space-y-2">
                            {sections.length === 0 ? (
                                <div className="py-4 text-center">No sections found.</div>
                            ) : (
                                sections.map((section) => (
                                    <div key={section.id} className="flex items-center justify-between border rounded px-3 py-2">
                                        <div>
                                            <span className="font-semibold">{section.sectionName}</span>
                                            <span className="ml-2 text-xs text-gray-500">({section.class?.className || "-"})</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setEditSectionModalOpen(true); setSelectedSection(section); setSectionNameInput(section.sectionName); }}><FaPencil/></Button>
                                            {sections.length > 1 && (
                                                <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => { setRemoveSectionModalOpen(true); setSelectedSection(section); }}><FaTrash/></Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setSectionsModalOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Remove Section Confirmation Modal */}
            <Dialog open={removeSectionModalOpen} onOpenChange={v => { setRemoveSectionModalOpen(v); if (!v) setSelectedSection(null); }}>
                <DialogContent>
                    <DialogTitle>Confirm Remove</DialogTitle>
                    <p>Are you sure you want to remove this section?</p>
                    <DialogFooter>
                        <Button variant="destructive" className="cursor-pointer" onClick={handleRemoveSection}>Remove</Button>
                        <Button variant="outline" className="cursor-pointer" onClick={() => setRemoveSectionModalOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Section Modal */}
            <Dialog open={editSectionModalOpen} onOpenChange={v => { setEditSectionModalOpen(v); if (!v) setSelectedSection(null); }}>
                <DialogContent>
                    <DialogTitle>Edit Section</DialogTitle>
                    <form onSubmit={handleEditSection} className="space-y-2">
                        <Input
                            value={sectionNameInput}
                            onChange={e => setSectionNameInput(e.target.value)}
                            required
                            placeholder="Section Name"
                        />
                        <DialogFooter>
                            <Button type="submit">Update</Button>
                            <Button type="button" variant="outline" onClick={() => setEditSectionModalOpen(false)}>Cancel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Add Section Modal */}
            <Dialog open={addSectionModalOpen} onOpenChange={v => setAddSectionModalOpen(v)}>
                <DialogContent>
                    <DialogTitle>Add Section</DialogTitle>
                    <form onSubmit={handleAddSection} className="space-y-2">
                        <Input
                            value={sectionNameInput}
                            onChange={e => setSectionNameInput(e.target.value)}
                            required
                            placeholder="Section Name"
                        />
                        <DialogFooter>
                            <Button className="cursor-pointer" type="submit">Add</Button>
                            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => setAddSectionModalOpen(false)}>Cancel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}