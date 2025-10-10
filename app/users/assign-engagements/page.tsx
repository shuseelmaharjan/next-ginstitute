"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import apiHandler from "@/app/api/apiHandler";
import { formatDuration } from "@/utils/formatDuration";
import { Input } from "@/components/ui/input";
import { Select as ShadSelect, SelectTrigger as ShadSelectTrigger, SelectValue as ShadSelectValue, SelectContent as ShadSelectContent, SelectItem as ShadSelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import {router} from "next/client";

// Define types
interface UserInfo {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  remark?: string;
  profile?: string;
}
interface AdmissionFeeStructure {
  id: number;
  feeType: string;
  amount: number;
  currency: string;
  description?: string;
}
interface EnrollmentInfo {
  user?: UserInfo;
  admissionFeeStructures?: AdmissionFeeStructure[];
}

export default function ConfigureFeeStructurePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "";

  // State for enrollment info
  const [enrollmentInfo, setEnrollmentInfo] = useState<EnrollmentInfo | null>(null);
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);

  // State for faculties
  const [faculties, setFaculties] = useState<Array<{ id: number; facultyName: string }>>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [loadingFaculties, setLoadingFaculties] = useState(false);

  // State for departments
  const [departments, setDepartments] = useState<Array<{ id: number; departmentName: string }>>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // State for classrooms
  const [classrooms, setClassrooms] = useState<Array<{ id: number; className: string }>>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  // State for sections
  const [sections, setSections] = useState<Array<{ id: number; sectionName: string }>>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loadingSections, setLoadingSections] = useState(false);

  // State for courses
  const [courses, setCourses] = useState<Array<{ id: number; title: string; cost?: { cost: number; currency: string }; duration: number }>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Estimated fee
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("");

  // Add form state
  const [totalFees, setTotalFees] = useState<number>(estimatedFee);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const netFees = totalFees - discount;

  // State for confirmation dialog and form disable
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);

  // State for loading submit
  const [submitting, setSubmitting] = useState(false);

  // Fetch enrollment info
  useEffect(() => {
    if (!userId) return;
    setLoadingEnrollment(true);
    apiHandler({ url: `/api/v1/users/${userId}/enrollment-info`, method: "GET" })
      .then((data) => {
        setEnrollmentInfo(data.data);
        setLoadingEnrollment(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch enrollment info", variant: "destructive" });
        setLoadingEnrollment(false);
      });
  }, [userId]);

  // Fetch faculties
  useEffect(() => {
    setLoadingFaculties(true);
    apiHandler({ url: "/api/v1/faculty", method: "GET" })
      .then((data) => {
        setFaculties(data.data);
        setLoadingFaculties(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch faculties", variant: "destructive" });
        setLoadingFaculties(false);
      });
  }, []);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (!selectedFaculty) return;
    setLoadingDepartments(true);
    apiHandler({ url: `/api/v1/departmentsfaculty/${selectedFaculty}`, method: "GET" })
      .then((data) => {
        setDepartments(data.data);
        setLoadingDepartments(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch departments", variant: "destructive" });
        setLoadingDepartments(false);
      });
  }, [selectedFaculty]);

  // Fetch classrooms when department changes
  useEffect(() => {
    if (!selectedDepartment) return;
    setLoadingClassrooms(true);
    apiHandler({ url: `/api/v1/classes/department/${selectedDepartment}`, method: "GET" })
      .then((data) => {
        setClassrooms(data.data);
        setLoadingClassrooms(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch classrooms", variant: "destructive" });
        setLoadingClassrooms(false);
      });
  }, [selectedDepartment]);

  // Fetch sections when classroom changes
  useEffect(() => {
    if (!selectedClassroom) return;
    setLoadingSections(true);
    apiHandler({ url: `/api/v1/sections/class/${selectedClassroom}`, method: "GET" })
      .then((data) => {
        setSections(data.data);
        setLoadingSections(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch sections", variant: "destructive" });
        setLoadingSections(false);
      });
  }, [selectedClassroom]);

  // Fetch courses when department changes
  useEffect(() => {
    if (!selectedDepartment) return;
    setLoadingCourses(true);
    apiHandler({ url: `/api/v1/courses/department/${selectedDepartment}/info-with-cost`, method: "GET" })
      .then((data) => {
        setCourses(data.data);
        setLoadingCourses(false);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
        setLoadingCourses(false);
      });
  }, [selectedDepartment]);

  // Calculate estimated fee
  useEffect(() => {
    if (!enrollmentInfo) return;
    let total = 0;
    let curr = "";
    if (enrollmentInfo.admissionFeeStructures && Array.isArray(enrollmentInfo.admissionFeeStructures)) {
      enrollmentInfo.admissionFeeStructures.forEach((fee) => {
        total += Number(fee.amount);
        curr = fee.currency;
      });
    }
    if (selectedCourse) {
      const course = courses.find((c) => String(c.id) === selectedCourse);
      if (course && course.cost) {
        total += Number(course.cost.cost);
        curr = course.cost.currency;
      }
    }
    setEstimatedFee(total);
    setCurrency(curr);
  }, [enrollmentInfo, selectedCourse, courses]);

  // Update totalFees when estimatedFee changes
  useEffect(() => {
    setTotalFees(estimatedFee);
  }, [estimatedFee]);

  // Form submit handler (called after confirmation)
  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    const enrollmentDate = "2025-10-10"; // Use context date
    const formData: {
      user_id: string;
      department_id: string;
      course_id: string;
      class_id: string;
      section_id: string;
      enrollmentDate: string;
      totalFees: number;
      discount: number;
      netFees: number;
      discountType?: string;
      remarks?: string;
    } = {
      user_id: userId,
      department_id: selectedDepartment,
      course_id: selectedCourse,
      class_id: selectedClassroom,
      section_id: selectedSection,
      enrollmentDate,
      totalFees,
      discount,
      netFees,
    };
    if (discountType) formData.discountType = discountType;
    if (remarks) formData.remarks = remarks;
    try {
      const result = await apiHandler({
        url: "/api/v1/student-enrollments",
        method: "POST",
        data: formData,
      });
      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "success" });
        setFormDisabled(true);
        router.push("/users");
      } else {
        toast({ title: "Error", description: result.message || "Failed to enroll student.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to enroll student.", variant: "destructive" });
    }
    setSubmitting(false);
    setOpenConfirm(false);
  };

  // Form submit handler (opens confirmation)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  // Select enable/disable logic
  const facultyDisabled = loadingFaculties;
  const departmentDisabled = !selectedFaculty || loadingDepartments;
  const classroomDisabled = !selectedDepartment || loadingClassrooms;
  const sectionDisabled = !selectedClassroom || loadingSections;
  const courseDisabled = !selectedDepartment || loadingCourses;

  return (
    <div className="space-y-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Assign Engagements</h2>
            <p className="text-muted-foreground">
                  Assign faculty, department, classroom, section, and courses to the user.
            </p>
        </div>
        <div className="p-4 border-1 shadow rounded-md mx-auto py-4 space-y-8">
            {/* Personal Info & Required Fees Row */}
            <div className="flex flex-col md:flex-row md:gap-8">
                <Card className="flex-1 mb-4 md:mb-0 border-1 shadow-none">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <Separator/>
                    <CardContent className="flex gap-6 items-center">
                        {loadingEnrollment ? (
                            <Skeleton className="h-20 w-20 rounded-full" />
                        ) : (
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${enrollmentInfo?.user?.profile || ""}`} alt="Profile" className="object-cover"/>
                                <AvatarFallback>{enrollmentInfo?.user?.firstName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className="space-y-2">
                            <div className="flex gap-20">
                                <div>
                                    <Label>Name:</Label>
                                    <span className="ml-2 font-semibold">
                  {enrollmentInfo?.user?.firstName} {enrollmentInfo?.user?.middleName ? enrollmentInfo.user.middleName + " " : ""}{enrollmentInfo?.user?.lastName}
                </span>
                                </div>
                                <div>
                                    <Label>Date of Birth:</Label>
                                    <span className="ml-2">{enrollmentInfo?.user?.dateOfBirth}</span>
                                </div>
                            </div>
                            <div>
                                <Label>Remark:</Label>
                                <span className="ml-2">{enrollmentInfo?.user?.remark}</span>
                            </div>

                        </div>
                    </CardContent>
                </Card>
                <Card className="flex-1 mb-4 md:mb-0 border-1 shadow-none">
                    <CardHeader>
                        <CardTitle>Required Fees</CardTitle>
                    </CardHeader>
                    <Separator/>
                    <CardContent>
                        {loadingEnrollment ? (
                            <Skeleton className="h-8 w-full" />
                        ) : (
                            <div className="space-y-2">
                                {enrollmentInfo?.admissionFeeStructures?.map((fee) => (
                                    <div key={fee.id} className="flex items-center gap-4">
                                        <Badge variant="default">{fee.feeType}</Badge>
                                        <span className="font-semibold">{fee.amount} {fee.currency.toUpperCase()}</span>
                                        <span className="text-muted-foreground">{fee.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Selects Row */}
            <Card className="flex-1 mb-4 md:mb-0 border-1 shadow-none">
                <CardHeader>
                    <CardTitle>Assign Engagements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className='space-y-2'>
                            <Label>Faculty</Label>
                            <Select value={selectedFaculty} onValueChange={setSelectedFaculty} disabled={facultyDisabled}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingFaculties ? "Loading..." : "Select Faculty"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculties.map((faculty) => (
                                        <SelectItem key={faculty.id} value={String(faculty.id)}>{faculty.facultyName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label>Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={departmentDisabled}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select Department"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={String(dept.id)}>{dept.departmentName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label>Classroom</Label>
                            <Select value={selectedClassroom} onValueChange={setSelectedClassroom} disabled={classroomDisabled}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingClassrooms ? "Loading..." : "Select Classroom"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classrooms.map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>{cls.className}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label>Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={sectionDisabled}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingSections ? "Loading..." : "Select Section"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((section) => (
                                        <SelectItem key={section.id} value={String(section.id)}>{section.sectionName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label>Course</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={courseDisabled}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingCourses ? "Loading..." : "Select Course"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={String(course.id)}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{course.title}</span>
                                                <span className="text-xs text-muted-foreground">{course.cost?.cost} {course.cost?.currency?.toUpperCase()} for {formatDuration(course.duration)}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Estimated Fee Row */}
            <Card className="flex-1 mb-4 md:mb-0 border-1 shadow-none mt-6">
                <CardHeader>
                    <CardTitle>Assign Fee</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      {/* Left: Selected Course Fee */}
                      <div className="md:w-1/2">
                        <div className="flex items-center gap-4 text-lg font-bold">
                          <span>Estimated Cost: </span>
                          <span>{estimatedFee} {currency?.toUpperCase()}</span>
                        </div>
                          {selectedCourse && (
                              (() => {
                                  const course = courses.find((c) => String(c.id) === selectedCourse);
                                  if (!course) return null;
                                  return (
                                      <div className="mb-4 p-4 rounded bg-muted">
                                          <div className="font-semibold">Course Fee</div>
                                          <div className="text-lg">
                                              {course.cost?.cost} {course.cost?.currency?.toUpperCase()} for {formatDuration(course.duration)}
                                          </div>
                                      </div>
                                  );
                              })()
                          )}
                      </div>
                      {/* Right: Custom Costing Form */}
                      <form className="md:w-1/2 space-y-4" onSubmit={handleSubmit}>
                        {/* First row: Total Fee, Discount, Discount Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          <div className='space-y-2'>
                            <Label>Total Fee</Label>
                            <Input type="number" value={totalFees} onChange={e => setTotalFees(Number(e.target.value))} min={0} />
                          </div>
                          <div className='space-y-2'>
                            <Label>Discount</Label>
                            <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={0} />
                          </div>
                        </div>
                        {/* Second row: Net Fee and Remark */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                          <div>
                            <Label>Net Fee</Label>
                            <span className="font-bold text-lg mt-1 block">{netFees} {currency?.toUpperCase()}</span>
                          </div>
                            <div className='space-y-2'>
                                <Label>Discount Type</Label>
                                <ShadSelect value={discountType} onValueChange={setDiscountType}>
                                    <ShadSelectTrigger className="w-full mt-2">
                                        <ShadSelectValue placeholder="Select Type" />
                                    </ShadSelectTrigger>
                                    <ShadSelectContent>
                                        <ShadSelectItem value="none">None</ShadSelectItem>
                                        <ShadSelectItem value="scholarship">Scholarship</ShadSelectItem>
                                        <ShadSelectItem value="regular">Regular</ShadSelectItem>
                                        <ShadSelectItem value="other">Other</ShadSelectItem>
                                    </ShadSelectContent>
                                </ShadSelect>
                            </div>
                        </div>
                          <div className='space-y-2'>
                              <Label>Remark</Label>
                              <Input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} />
                          </div>
                        {/* Third row: Submit button at right */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                          <div></div>
                          <div className="flex items-end h-full justify-end">
                            <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
                              <AlertDialogTrigger asChild>
                                <Button type="submit" className="w-full md:w-auto cursor-pointer" disabled={formDisabled || submitting}>Submit</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to submit? <br />
                                    <span className="text-destructive font-semibold">Later you won&apos;t be able to update it.</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="cursor-pointer" disabled={submitting}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction disabled={submitting} className="cursor-pointer" onClick={handleConfirmedSubmit}>Confirm &amp; Submit</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </form>
                      {formDisabled && (
                        <div className="mt-4 text-center text-destructive font-semibold">Submission complete. You cannot update this enrollment.</div>
                      )}
                    </div>
                </CardContent>
            </Card>

        </div>

    </div>
  );
}
