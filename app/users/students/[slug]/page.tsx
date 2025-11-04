"use client"
import { useParams } from "next/navigation";
import {decryptNumber} from "@/utils/numberCrypto";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiHandler from "@/app/api/apiHandler";
import { Badge } from "@/components/ui/badge";
import { convertToBS, formatADDate } from "@/utils/dateUtils";
import { 
    User, 
    Mail, 
    Calendar, 
    Shield, 
    UserCheck, 
    Clock, 
    Users, 
    MapPin, 
    FileText, 
    GraduationCap, 
    CheckCircle2, 
    XCircle,
    Phone,
    Home,
    Building,
    MoreHorizontal,
    Edit
} from "lucide-react";
import { toSentenceCase } from "@/utils/textUtils";
import { formatDate } from "@/utils/formatDate";
import { 
    ImageZoom, 
    ImageZoomTrigger, 
    ImageZoomContent, 
    ImageZoomImage 
} from "@/components/ui/image-zoom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/hooks/use-toast";

// Document Card Component
function DocumentCard({ doc }: { doc: any }) {
    const [imageError, setImageError] = useState(false);
    const imageUrl = doc.document ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${doc.document}` : null;
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <div className="relative">
                {imageUrl && !imageError ? (
                    <ImageZoom>
                        <ImageZoomTrigger>
                            <img 
                                src={imageUrl}
                                alt={doc.type} 
                                className="h-24 w-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow" 
                                onError={() => {
                                    console.error('Image failed to load:', imageUrl);
                                    setImageError(true);
                                }}
                            />
                        </ImageZoomTrigger>
                        <ImageZoomContent title={`${toSentenceCase(doc.type)} Document`}>
                            <div className="flex flex-col items-center space-y-4">
                                <ImageZoomImage
                                    src={imageUrl}
                                    alt={`${doc.type} - Full Size`}
                                />
                                <div className="text-center text-white">
                                    <Badge variant="secondary" className="text-sm mb-2">
                                        {toSentenceCase(doc.type)}
                                    </Badge>
                                    <div className="text-sm text-gray-300 flex items-center gap-2 justify-center">
                                        <Calendar className="h-4 w-4" />
                                        Uploaded: {doc.createdAt?.slice(0, 10)}
                                    </div>
                                    {doc.createdBy && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            By: {typeof doc.createdBy === 'string' ? doc.createdBy : doc.createdBy?.fullName || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ImageZoomContent>
                    </ImageZoom>
                ) : (
                    <div className="h-24 w-24 bg-gray-100 rounded-lg border shadow-sm flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="text-center">
                <Badge variant="outline" className="text-xs">
                    {toSentenceCase(doc.type)}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {doc.createdAt?.slice(0, 10)}
                </div>
            </div>
        </div>
    );
}

export default function userSlugPage() {
    const params = useParams();
    const slug = params?.slug;
    const userId = typeof slug === "string" ? decryptNumber(slug) : undefined;
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        email: "",
        dob: ""
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isGuardianUpdateModalOpen, setIsGuardianUpdateModalOpen] = useState(false);
    const [guardianUpdateForm, setGuardianUpdateForm] = useState({
        fatherName: "",
        motherName: "",
        grandfatherName: "",
        grandmotherName: "",
        guardianName: "",
        guardianContact: "",
        fatherNumber: "",
        motherNumber: "",
        emergencyContact: ""
    });
    const [isUpdatingGuardian, setIsUpdatingGuardian] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError("");
            try {
                const res = await apiHandler({
                    url: `/api/v1/users/${userId}/all-information`,
                    method: "GET"
                });
                if (res.success) {
                    setUserData(res.data);
                } else {
                    setError(res.message || "Failed to fetch data");
                }
            } catch (err) {
                setError("Failed to fetch data");
            }
            setLoading(false);
        }
        if (userId) fetchData();
    }, [userId]);

    const handleUpdateInfo = async () => {
        if (!updateForm.email && !updateForm.dob) {
            toast({
                title: "Error",
                description: "Please fill at least one field",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        try {
            const updateData: any = {};
            if (updateForm.email) updateData.email = updateForm.email;
            if (updateForm.dob) updateData.dob = updateForm.dob;

            const res = await apiHandler({
                url: `/api/v1/update-email-or-dob/${userId}`,
                method: "PUT",
                data: updateData
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: "Information updated successfully",
                    variant: "success",
                });
                setIsUpdateModalOpen(false);
                setUpdateForm({ email: "", dob: "" });
                // Refresh the user data
                if (userId) {
                    const refreshRes = await apiHandler({
                        url: `/api/v1/users/${userId}/all-information`,
                        method: "GET"
                    });
                    if (refreshRes.success) {
                        setUserData(refreshRes.data);
                    }
                }
            } else {
                toast({
                    title: "Error",
                    description: res.message || "Failed to update information",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to update information",
                variant: "destructive",
            });
        }
        setIsUpdating(false);
    };

    const openUpdateModal = () => {
        setUpdateForm({
            email: personalInfo?.email || "",
            dob: personalInfo?.dateOfBirth || ""
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateGuardianInfo = async () => {
        setIsUpdatingGuardian(true);
        try {
            const res = await apiHandler({
                url: `/api/v1/users/update-guardian-info/${userId}`,
                method: "PUT",
                data: guardianUpdateForm
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: "Guardian information updated successfully",
                    variant: "success",
                });
                setIsGuardianUpdateModalOpen(false);
                // Refresh the user data
                if (userId) {
                    const refreshRes = await apiHandler({
                        url: `/api/v1/users/${userId}/all-information`,
                        method: "GET"
                    });
                    if (refreshRes.success) {
                        setUserData(refreshRes.data);
                    }
                }
            } else {
                toast({
                    title: "Error",
                    description: res.message || "Failed to update guardian information",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to update guardian information",
                variant: "destructive",
            });
        }
        setIsUpdatingGuardian(false);
    };

    const openGuardianUpdateModal = () => {
        setGuardianUpdateForm({
            fatherName: guardianInfo?.fatherName || "",
            motherName: guardianInfo?.motherName || "",
            grandfatherName: guardianInfo?.grandfatherName || "",
            grandmotherName: guardianInfo?.grandmotherName || "",
            guardianName: guardianInfo?.guardianName || "",
            guardianContact: guardianInfo?.guardianContact || "",
            fatherNumber: guardianInfo?.fatherNumber || "",
            motherNumber: guardianInfo?.motherNumber || "",
            emergencyContact: guardianInfo?.emergencyContact || ""
        });
        setIsGuardianUpdateModalOpen(true);
    };

    if (loading) {
        return <Skeleton className="h-32 w-full" />;
    }
    if (error) {
        return <div className="text-destructive">{error}</div>;
    }
    if (!userData) {
        return <div>No user data found.</div>;
    }
    const { personalInfo, guardianInfo, addressInfo, accountStatus, accountCreatedUpdatedInfo, userDocumentInfo, enrollmentInfo, inactiveEnrollmentInfo } = userData;
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">{personalInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{toSentenceCase(personalInfo.role)} | {toSentenceCase(personalInfo.sex)}</p>
            </div>
            {/* First Row - Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile (Col 1) */}
                <Card>
                    <CardContent className="flex flex-col items-center p-2">
                        <ImageZoom>
                            <ImageZoomTrigger>
                                <img 
                                    src={personalInfo.profile ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${personalInfo.profile}` : '/default-profile.png'} 
                                    alt={personalInfo.name} 
                                    className="h-72 w-56 object-cover rounded border shadow-sm mb-4" 
                                />
                            </ImageZoomTrigger>
                            <ImageZoomContent title={`Profile Photo - ${personalInfo.name}`}>
                                <div className="flex flex-col items-center space-y-4">
                                    <ImageZoomImage
                                        src={personalInfo.profile ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${personalInfo.profile}` : '/default-profile.png'}
                                        alt={`${personalInfo.name} - Profile Photo`}
                                    />
                                    <div className="text-center text-white">
                                        <h3 className="text-xl font-semibold mb-2">{personalInfo.name}</h3>
                                        <div className="text-sm text-gray-300 space-y-1">
                                            <div className="flex items-center gap-2 justify-center">
                                                <User className="h-4 w-4" />
                                                {personalInfo.username}
                                            </div>
                                            <div className="flex items-center gap-2 justify-center">
                                                <Shield className="h-4 w-4" />
                                                {toSentenceCase(personalInfo.role)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ImageZoomContent>
                        </ImageZoom>
                    </CardContent>
                </Card>

                {/* Personal Details (Col 2) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={openUpdateModal}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Update Info
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Username:</span>
                            <span>{personalInfo.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Email:</span>
                            <span>{personalInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Date of Birth:</span>
                            <div className="flex flex-col">
                                <span>{convertToBS(personalInfo.dateOfBirth) || 'N/A'}</span>
                                <span className="italic">({formatADDate(personalInfo.dateOfBirth) || 'N/A'})</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Status & Create/Update Info (Col 3) */}
                <div className="space-y-4">
                    {/* Account Status (Row 1 of Col 3) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Account Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">User:</span>
                                <Badge variant={accountStatus.status === 'Enrolled' ? 'default' : 'secondary'}>
                                    {accountStatus.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Status:</span>
                                {accountStatus.isActive ? (
                                    <Badge variant="default" className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                            {accountStatus.graduatedDate && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Graduated:</span>
                                    <span>{accountStatus.graduatedDate}</span>
                                </div>
                            )}
                            {accountStatus.leaveReason && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Leave Reason:</span>
                                    <span>{accountStatus.leaveReason}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Create/Update Info (Row 2 of Col 3) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Account History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Created:</span>
                                    <span>{formatDate(accountCreatedUpdatedInfo.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Created By:</span>
                                    <span className="text-sm">{accountCreatedUpdatedInfo.createdBy?.fullName || accountCreatedUpdatedInfo.createdBy || 'N/A'}</span>
                                </div>
                            </div>
                            {accountCreatedUpdatedInfo.updatedAt && (
                                <div className="space-y-2 border-t pt-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Updated:</span>
                                        <span>{accountCreatedUpdatedInfo.updatedAt?.slice(0, 10)}</span>
                                    </div>
                                    {accountCreatedUpdatedInfo.updatedBy && (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Updated By:</span>
                                            <span className="text-sm">{accountCreatedUpdatedInfo.updatedBy?.fullName || accountCreatedUpdatedInfo.updatedBy || 'N/A'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Active Enrollment - Full Width Row */}
            {enrollmentInfo?.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Active Enrollment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {enrollmentInfo.map((enroll: any) => (
                                <div key={enroll.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Building className="h-4 w-4" />
                                                {enroll.class?.className} - {enroll.section?.sectionName}
                                            </h3>
                                            <p className="text-muted-foreground">{enroll.department?.departmentName}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Enrollment:</span>
                                                <span>{enroll.enrollmentDate?.slice(0, 10)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Total Fees:</span>
                                                <Badge variant="outline">{enroll.totalFees}</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Discount:</span>
                                                <span>{enroll.discount} {enroll.discountType}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Net Fees:</span>
                                                <Badge>{enroll.netFees}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {enroll.remarks && (
                                        <div className="mt-3 p-3 bg-white rounded border">
                                            <span className="font-medium">Remarks:</span> {enroll.remarks}
                                        </div>
                                    )}
                                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        Created by: {enroll.createdBy?.fullName || enroll.createdBy || 'N/A'} on {enroll.createdAt?.slice(0, 10)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Guardian Information */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Guardian Information
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={openGuardianUpdateModal}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Update Info
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Father:</span>
                                <span>{guardianInfo.fatherName}</span>
                                {guardianInfo.fatherNumber && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{guardianInfo.fatherNumber}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Mother:</span>
                                <span>{guardianInfo.motherName}</span>
                                {guardianInfo.motherNumber && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{guardianInfo.motherNumber}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Grandfather:</span>
                                <span>{guardianInfo.grandfatherName}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Grandmother:</span>
                                <span>{guardianInfo.grandmotherName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Guardian:</span>
                                <span>{guardianInfo.guardianName}</span>
                                {guardianInfo.guardianContact && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{guardianInfo.guardianContact}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Emergency Contact:</span>
                                <span className="text-sm text-red-500 font-semibold">{guardianInfo.emergencyContact}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Permanent Address */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Permanent Address
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Country:</span> {addressInfo.country}</div>
                                <div><span className="font-medium">State:</span> {addressInfo.permanentState}</div>
                                <div><span className="font-medium">City:</span> {addressInfo.permanentCity}</div>
                                <div><span className="font-medium">Local Government:</span> {addressInfo.permanentLocalGovernment}</div>
                                <div><span className="font-medium">Ward:</span> {addressInfo.permanentWardNumber}</div>
                                <div><span className="font-medium">Tole:</span> {addressInfo.permanentTole}</div>
                                <div><span className="font-medium">Postal Code:</span> {addressInfo.permanentPostalCode}</div>
                            </div>
                        </div>
                        {/* Temporary Address */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Temporary Address
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="font-medium">State:</span> {addressInfo.tempState}</div>
                                <div><span className="font-medium">City:</span> {addressInfo.tempCity}</div>
                                <div><span className="font-medium">Local Government:</span> {addressInfo.tempLocalGovernment}</div>
                                <div><span className="font-medium">Ward:</span> {addressInfo.tempWardNumber}</div>
                                <div><span className="font-medium">Tole:</span> {addressInfo.tempTole}</div>
                                <div><span className="font-medium">Postal Code:</span> {addressInfo.tempPostalCode}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* User Documents */}
            {userDocumentInfo?.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            User Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {userDocumentInfo.map((doc: any) => (
                                <DocumentCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inactive Enrollment Info */}
            {inactiveEnrollmentInfo?.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Inactive Enrollments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {inactiveEnrollmentInfo.map((enroll: any) => (
                                <div key={enroll.id} className="border rounded-lg p-4 bg-gray-50 border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Building className="h-4 w-4" />
                                                {enroll.class?.className} - {enroll.section?.sectionName}
                                            </h3>
                                            <p className="text-muted-foreground">{enroll.department?.departmentName}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Enrollment:</span>
                                                <span>{enroll.enrollmentDate?.slice(0, 10)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Total Fees:</span>
                                                <Badge variant="outline">{enroll.totalFees}</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Discount:</span>
                                                <span>{enroll.discount} {enroll.discountType}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Net Fees:</span>
                                                <Badge variant="secondary">{enroll.netFees}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {enroll.remarks && (
                                        <div className="mt-3 p-3 bg-white rounded border">
                                            <span className="font-medium">Remarks:</span> {enroll.remarks}
                                        </div>
                                    )}
                                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        Created by: {enroll.createdBy?.fullName || enroll.createdBy || 'N/A'} on {enroll.createdAt?.slice(0, 10)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Update Information Modal */}
            <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Personal Information</DialogTitle>
                        <DialogDescription>
                            Update email address or date of birth. You can update either field or both.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={updateForm.email}
                                onChange={(e) => setUpdateForm(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3"
                                placeholder="Enter new email"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dob" className="text-right">
                                Date of Birth
                            </Label>
                            <Input
                                id="dob"
                                type="date"
                                value={updateForm.dob}
                                onChange={(e) => setUpdateForm(prev => ({ ...prev, dob: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsUpdateModalOpen(false)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdateInfo}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Updating..." : "Update Info"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Guardian Information Modal */}
            <Dialog open={isGuardianUpdateModalOpen} onOpenChange={setIsGuardianUpdateModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update Guardian Information</DialogTitle>
                        <DialogDescription>
                            Update guardian and family information. All fields are required.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fatherName">Father Name *</Label>
                                <Input
                                    id="fatherName"
                                    type="text"
                                    value={guardianUpdateForm.fatherName}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, fatherName: e.target.value }))}
                                    placeholder="Enter father's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fatherNumber">Father Contact</Label>
                                <Input
                                    id="fatherNumber"
                                    type="tel"
                                    value={guardianUpdateForm.fatherNumber}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, fatherNumber: e.target.value }))}
                                    placeholder="Enter father's contact"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="motherName">Mother Name *</Label>
                                <Input
                                    id="motherName"
                                    type="text"
                                    value={guardianUpdateForm.motherName}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, motherName: e.target.value }))}
                                    placeholder="Enter mother's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="motherNumber">Mother Contact</Label>
                                <Input
                                    id="motherNumber"
                                    type="tel"
                                    value={guardianUpdateForm.motherNumber}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, motherNumber: e.target.value }))}
                                    placeholder="Enter mother's contact"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grandfatherName">Grandfather Name *</Label>
                                <Input
                                    id="grandfatherName"
                                    type="text"
                                    value={guardianUpdateForm.grandfatherName}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, grandfatherName: e.target.value }))}
                                    placeholder="Enter grandfather's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grandmotherName">Grandmother Name *</Label>
                                <Input
                                    id="grandmotherName"
                                    type="text"
                                    value={guardianUpdateForm.grandmotherName}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, grandmotherName: e.target.value }))}
                                    placeholder="Enter grandmother's name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="guardianName">Guardian Name *</Label>
                                <Input
                                    id="guardianName"
                                    type="text"
                                    value={guardianUpdateForm.guardianName}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, guardianName: e.target.value }))}
                                    placeholder="Enter guardian's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guardianContact">Guardian Contact *</Label>
                                <Input
                                    id="guardianContact"
                                    type="tel"
                                    value={guardianUpdateForm.guardianContact}
                                    onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, guardianContact: e.target.value }))}
                                    placeholder="Enter guardian's contact"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                            <Input
                                id="emergencyContact"
                                type="tel"
                                value={guardianUpdateForm.emergencyContact}
                                onChange={(e) => setGuardianUpdateForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                placeholder="Enter emergency contact number"
                                className="w-full"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsGuardianUpdateModalOpen(false)}
                            disabled={isUpdatingGuardian}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdateGuardianInfo}
                            disabled={isUpdatingGuardian}
                        >
                            {isUpdatingGuardian ? "Updating..." : "Update Guardian Info"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
        </div>
    );
}