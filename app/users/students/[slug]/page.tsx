"use client"
import { useParams } from "next/navigation";
import {decryptNumber} from "@/utils/numberCrypto";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
    Building
} from "lucide-react";
import { toSentenceCase } from "@/utils/textUtils";
import { formatDate } from "@/utils/formatDate";

// Document Card Component
function DocumentCard({ doc }: { doc: any }) {
    const [imageError, setImageError] = useState(false);
    const imageUrl = doc.document ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${doc.document}` : null;
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <div className="relative group">
                {imageUrl && !imageError ? (
                    <img 
                        src={imageUrl}
                        alt={doc.type} 
                        className="h-24 w-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                        onError={() => {
                            console.error('Image failed to load:', imageUrl);
                            setImageError(true);
                        }}
                    />
                ) : (
                    <div className="h-24 w-24 bg-gray-100 rounded-lg border shadow-sm flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg"></div>
            </div>
            <div className="text-center">
                <Badge variant="outline" className="text-xs">
                    {doc.type}
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
                        <img src={personalInfo.profile ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${personalInfo.profile}` : '/default-profile.png'} alt={personalInfo.name} className="h-36 w-32 object-cover rounded border shadow-sm mb-4" />
                    </CardContent>
                </Card>

                {/* Personal Details (Col 2) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
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
                                    <span className="text-sm">{accountCreatedUpdatedInfo.createdBy?.fullName}</span>
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
                                            <span className="text-sm">{accountCreatedUpdatedInfo.updatedBy?.fullName}</span>
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
                                        Created by: {enroll.createdBy?.fullName} on {enroll.createdAt?.slice(0, 10)}
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
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Guardian Information
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
                                <Badge variant="destructive">{guardianInfo.emergencyContact}</Badge>
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
                                        Created by: {enroll.createdBy?.fullName} on {enroll.createdAt?.slice(0, 10)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}