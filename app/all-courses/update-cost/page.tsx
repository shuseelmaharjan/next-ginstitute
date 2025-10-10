"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import apiHandler from "@/app/api/apiHandler";
import { toast } from "@/components/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/utils/formatDuration";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Spinner } from "@/components/ui/spinner"

interface Department {
  id: number;
  departmentName: string;
}
interface CreatedByUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
interface Course {
  id: number;
  title: string;
  description: string;
  duration: number;
  image: string;
  coverImage: string;
  department?: Department;
  createdByUser?: CreatedByUser;
}

export default function UpdateCourseCostPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("course");
  const currencyParam = searchParams.get("currency") || "NPR";
  const costParam = searchParams.get("course-cost") || "";

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [cost, setCost] = useState(costParam);
  const [currency, setCurrency] = useState(currencyParam.toUpperCase());
  const [submitting, setSubmitting] = useState(false);

  console.log("Course ID from URL:", courseId, currencyParam, costParam);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await apiHandler({
          url: `/api/v1/courses/${courseId}`,
          method: "GET",
        });
        if (data.success && data.data) {
          setCourse(data.data as Course);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch course.",
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        let message = "Failed to fetch course.";
        if (err && typeof err === "object" && "message" in err) {
          message = (err as { message: string }).message;
        }
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    if (courseId) fetchCourse();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cost.trim() || isNaN(Number(cost))) {
      toast({
        title: "Validation Error",
        description: "Cost must be a valid number.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        currency,
        cost: parseFloat(Number(cost).toFixed(2)),
        course_id: Number(courseId),
      };
      const data = await apiHandler({
        url: `/api/v1/update-course-costs`,
        method: "POST",
        data: payload,
      });
      if (data.success) {
        toast({
          title: "Success",
          description: "Course cost updated successfully!",
          variant: "success",
        });
        router.push("/all-courses");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update course cost.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      let message = "Failed to update course cost.";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as { message: string }).message;
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      width: "100%",
  }}>
      <Spinner />
  </div>;
  if (!course) return <div className="p-4">Course not found.</div>;

  return (
    <div className="p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Update Cost for Course</h2>
        <p className="text-muted-foreground">Update cost details for the selected course.</p>
      </div>
      <div className="mx-auto my-8 rounded-md shadow border-1 overflow-hidden bg-white">
        <div className="relative h-64 w-full flex items-center justify-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${course.coverImage}`}
            alt="Cover"
            fill
            style={{ objectFit: "cover" }}
            className="absolute inset-0 w-full h-full z-0"
          />
          <div className="absolute inset-0 bg-black/40 z-10" />
          <h1 className="relative z-20 text-3xl font-bold text-white text-center drop-shadow-lg">
            {course.title}
          </h1>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-6 items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Duration:</span>
              <span className="text-gray-900 font-medium">{formatDuration(course.duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Department:</span>
              <span className="text-gray-900 font-medium">{course.department?.departmentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Created By:</span>
              <span className="text-gray-900 font-medium">{course.createdByUser?.firstName} {course.createdByUser?.lastName}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Description</h2>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: course.description }} />
          </div>
          <Separator />
          <form className="space-y-4 bg-white rounded-md border-1 p-6 mt-4" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block font-medium mb-1">Currency</label>
                <Input value={currency} readOnly className="bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <label className="block font-medium">Cost</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer text-muted-foreground" aria-label="Cost info"><Info size={16} /></span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Enter the course cost (e.g. 4000.00)</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                  placeholder="Enter cost (e.g. 4000.00)"
                />
              </div>
            </div>
            <div className="flex justify-end md:w-auto w-full">
              <Button type="submit" disabled={submitting} className="px-6 py-2 font-semibold text-base cursor-pointer">
                {submitting ? "Updating..." : "Update Cost"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
