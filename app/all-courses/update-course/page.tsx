"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import apiHandler from "@/app/api/apiHandler";
import { toast } from "@/components/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/app/components/RichTextEditor";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {Spinner} from "@/components/ui/spinner";

type Faculty = {
    facultyName?: string;
};
type Department = {
    id: string | number;
    departmentName: string;
    faculty?: Faculty;
};

export default function UpdateCourse() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const courseId = searchParams.get("course");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [initialImage, setInitialImage] = useState<string | null>(null);
    const [initialCoverImage, setInitialCoverImage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function fetchDepartments() {
            try {
                const data = await apiHandler({
                    url: "/api/v1/departments",
                    method: "GET",
                });
                if (mounted && data.success && Array.isArray(data.data)) {
                    setDepartments(data.data as Department[]);
                }
            } catch (err: unknown) {
                let message = "Failed to load departments.";
                if (err && typeof err === "object" && "message" in err) {
                    message = (err as { message: string }).message;
                }
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive",
                });
            }
        }
        fetchDepartments();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        apiHandler({ url: `/api/v1/courses/${courseId}`, method: "GET" })
            .then((res) => {
                if (res.success && res.data) {
                    setTitle(res.data.title || "");
                    setDescription(res.data.description || "");
                    setDuration(String(res.data.duration || ""));
                    setDepartmentId(String(res.data.department_id || ""));
                    setInitialImage(res.data.image || null);
                    setInitialCoverImage(res.data.coverImage || null);
                    setImagePreview(res.data.image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.data.image}` : null);
                    setCoverImagePreview(res.data.coverImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.data.coverImage}` : null);
                } else {
                    toast({ title: "Error", description: "Course not found", variant: "destructive" });
                }
            })
            .catch(() => toast({ title: "Error", description: "Failed to fetch course", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, [courseId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(initialImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${initialImage}` : null);
        }
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setCoverImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCoverImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setCoverImagePreview(initialCoverImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${initialCoverImage}` : null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: string[] = [];
        if (!title.trim()) errors.push("Title is required.");
        if (!description.trim()) errors.push("Description is required.");
        const durationInt = Number(duration);
        if (!duration.trim()) {
            errors.push("Duration is required.");
        } else if (!Number.isInteger(durationInt) || durationInt <= 0) {
            errors.push("Course duration must be a positive integer.");
        }
        if (!departmentId) errors.push("Department is required.");
        if (image) {
            const validImage = image.type === "image/jpeg" || image.type === "image/jpg" || image.name.toLowerCase().endsWith(".jpg") || image.name.toLowerCase().endsWith(".jpeg");
            if (!validImage) errors.push("Course image must be a JPG or JPEG file.");
        }
        if (coverImage) {
            const validCover = coverImage.type === "image/jpeg" || coverImage.type === "image/jpg" || coverImage.name.toLowerCase().endsWith(".jpg") || coverImage.name.toLowerCase().endsWith(".jpeg");
            if (!validCover) errors.push("Cover image must be a JPG or JPEG file.");
        }
        if (errors.length > 0) {
            toast({
                title: "Form Validation Error",
                description: errors.join("\n"),
                variant: "destructive",
            });
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("duration", duration);
        formData.append("department_id", departmentId);
        if (image) formData.append("image", image);
        if (coverImage) formData.append("coverImage", coverImage);
        try {
            const data = await apiHandler({
                url: `/api/v1/courses/${courseId}`,
                method: "PUT",
                data: formData,
                onWarning: (msg) => toast({ title: "Warning", description: msg }),
                onError: (msg) => toast({ title: "Error", description: msg, variant: "destructive" }),
            });
            if (data.success) {
                toast({ title: "Success", description: "Course updated successfully!", variant: 'success' });
                router.push(`/all-courses`);
            }
        } catch (err: unknown) {
            let message = "Unknown error";
            if (err && typeof err === "object" && "message" in err) {
                message = (err as { message: string }).message;
            }
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !title) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "80vh",
                width: "100%",
            }}>
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Update Course Page</h2>
                <p>This is the update course page.</p>
            </div>
            <div className="border-1 p-4 shadow rounded-md">
                <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className='space-y-2'>
                        <div className="flex items-center gap-1">
                            <Label className="block font-medium">Title</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                </TooltipTrigger>
                                <TooltipContent side="right">Enter the course title</TooltipContent>
                            </Tooltip>
                        </div>
                        <Input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1">
                                <Label className="block font-medium">Duration</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Enter the duration in days, only use number</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input type="text" value={duration} onChange={e => setDuration(e.target.value)} required />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1">
                                <Label className="block font-medium">Department</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Select the department for this course</TooltipContent>
                                </Tooltip>
                            </div>
                            <Select value={departmentId} onValueChange={setDepartmentId} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dep => (
                                        <SelectItem key={dep.id} value={String(dep.id)}>
                                            {dep.departmentName} {dep.faculty?.facultyName ? `(${dep.faculty.facultyName})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <div className="flex items-center gap-1">
                            <Label className="block font-medium">Description</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                </TooltipTrigger>
                                <TooltipContent side="right">Provide a detailed course description</TooltipContent>
                            </Tooltip>
                        </div>
                        <RichTextEditor value={description} onChange={setDescription} placeholder="Enter course description..." />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1">
                                <Label className="block font-medium">Course Image</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Upload a representative image for the course</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input type="file" accept="image/*" onChange={handleImageChange} />
                            {imagePreview && (
                                <Card className="mt-2 p-2 w-fit">
                                    <Image src={imagePreview} alt="Course Preview" width={200} height={160} className="max-w-xs max-h-40 rounded" />
                                </Card>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1">
                                <Label className="block font-medium">Cover Image</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Upload a cover image for the course</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input type="file" accept="image/*" onChange={handleCoverImageChange} />
                            {coverImagePreview && (
                                <Card className="mt-2 p-2 w-fit">
                                    <Image src={coverImagePreview} alt="Cover Preview" width={200} height={160} className="max-w-xs max-h-40 rounded" />
                                </Card>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button type="submit" disabled={loading} className='cursor-pointer'>
                            {loading ? "Updating..." : "Update Course"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
