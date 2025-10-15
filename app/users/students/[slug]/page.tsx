"use client"
import { useParams } from "next/navigation";
import {decryptNumber} from "@/utils/numberCrypto";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import apiHandler from "@/app/api/apiHandler";
import { Badge } from "@/components/ui/badge";

export default function userSlugPage() {
    const params = useParams();
    const slug = params?.slug;
    const userId = decryptNumber(slug);
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
        <div className="space-y-6">
            {/* Personal Info */}
            <Card className="p-6 flex gap-6 items-center">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={personalInfo.profile ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${personalInfo.profile}` : undefined} alt={personalInfo.name} />
                    <AvatarFallback>{personalInfo.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <div className="font-bold text-2xl">{personalInfo.name}</div>
                    <div className="text-muted-foreground">Username: {personalInfo.username}</div>
                    <div>Email: {personalInfo.email}</div>
                    <div>Date of Birth: {personalInfo.dateOfBirth}</div>
                    <div>Sex: <Badge>{personalInfo.sex}</Badge></div>
                    <div>Role: <Badge>{personalInfo.role}</Badge></div>
                </div>
            </Card>
            {/* Guardian Info */}
            <Card className="p-6">
                <div className="font-bold text-lg mb-2">Guardian Information</div>
                <div className="grid grid-cols-2 gap-2">
                    <div>Father: {guardianInfo.fatherName} ({guardianInfo.fatherNumber})</div>
                    <div>Mother: {guardianInfo.motherName} ({guardianInfo.motherNumber})</div>
                    <div>Grandfather: {guardianInfo.grandfatherName}</div>
                    <div>Grandmother: {guardianInfo.grandmotherName}</div>
                    <div>Guardian: {guardianInfo.guardianName} ({guardianInfo.guardianContact})</div>
                    <div>Emergency Contact: {guardianInfo.emergencyContact}</div>
                </div>
            </Card>
            {/* Address Info */}
            <Card className="p-6">
                <div className="font-bold text-lg mb-2">Address Information</div>
                <div className="grid grid-cols-2 gap-2">
                    <div>Country: {addressInfo.country}</div>
                    <div>Permanent State: {addressInfo.permanentState}</div>
                    <div>Permanent City: {addressInfo.permanentCity}</div>
                    <div>Permanent Local Government: {addressInfo.permanentLocalGovernment}</div>
                    <div>Permanent Ward: {addressInfo.permanentWardNumber}</div>
                    <div>Permanent Tole: {addressInfo.permanentTole}</div>
                    <div>Permanent Postal Code: {addressInfo.permanentPostalCode}</div>
                    <div>Temporary State: {addressInfo.tempState}</div>
                    <div>Temporary City: {addressInfo.tempCity}</div>
                    <div>Temporary Local Government: {addressInfo.tempLocalGovernment}</div>
                    <div>Temporary Ward: {addressInfo.tempWardNumber}</div>
                    <div>Temporary Tole: {addressInfo.tempTole}</div>
                    <div>Temporary Postal Code: {addressInfo.tempPostalCode}</div>
                </div>
            </Card>
            {/* Account Status */}
            <Card className="p-6">
                <div className="font-bold text-lg mb-2">Account Status</div>
                <div>Status: <Badge>{accountStatus.status}</Badge></div>
                <div>Active: <Badge variant={accountStatus.isActive ? "default" : "destructive"}>{accountStatus.isActive ? "Yes" : "No"}</Badge></div>
                {accountStatus.graduatedDate && <div>Graduated Date: {accountStatus.graduatedDate}</div>}
                {accountStatus.leaveReason && <div>Leave Reason: {accountStatus.leaveReason}</div>}
            </Card>
            {/* Account Created/Updated Info */}
            <Card className="p-6">
                <div className="font-bold text-lg mb-2">Account Created/Updated Info</div>
                <div>Created At: {accountCreatedUpdatedInfo.createdAt?.slice(0, 10)}</div>
                <div>Created By: {accountCreatedUpdatedInfo.createdBy?.fullName}</div>
                {accountCreatedUpdatedInfo.updatedAt && <div>Updated At: {accountCreatedUpdatedInfo.updatedAt?.slice(0, 10)}</div>}
                {accountCreatedUpdatedInfo.updatedBy && <div>Updated By: {accountCreatedUpdatedInfo.updatedBy?.fullName}</div>}
            </Card>
            {/* User Documents */}
            {userDocumentInfo?.length > 0 && (
                <Card className="p-6">
                    <div className="font-bold text-lg mb-2">User Documents</div>
                    <div className="flex gap-4 flex-wrap">
                        {userDocumentInfo.map((doc: any) => (
                            <div key={doc.id} className="flex flex-col items-center">
                                <img src={doc.document ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${doc.document}` : undefined} alt={doc.type} className="h-24 w-24 object-cover rounded" />
                                <div className="mt-2 text-sm">{doc.type}</div>
                                <div className="text-xs text-muted-foreground">Created: {doc.createdAt?.slice(0, 10)}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            {/* Enrollment Info */}
            {enrollmentInfo?.length > 0 && (
                <Card className="p-6">
                    <div className="font-bold text-lg mb-2">Active Enrollment</div>
                    <div className="space-y-2">
                        {enrollmentInfo.map((enroll: any) => (
                            <div key={enroll.id} className="border rounded p-4">
                                <div className="font-semibold">{enroll.class?.className} - {enroll.section?.sectionName} ({enroll.department?.departmentName})</div>
                                <div>Enrollment Date: {enroll.enrollmentDate?.slice(0, 10)}</div>
                                <div>Total Fees: {enroll.totalFees}</div>
                                <div>Discount: {enroll.discount} {enroll.discountType}</div>
                                <div>Net Fees: {enroll.netFees}</div>
                                <div>Remarks: {enroll.remarks}</div>
                                <div className="text-xs text-muted-foreground">Created By: {enroll.createdBy?.fullName} on {enroll.createdAt?.slice(0, 10)}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            {/* Inactive Enrollment Info */}
            {inactiveEnrollmentInfo?.length > 0 && (
                <Card className="p-6">
                    <div className="font-bold text-lg mb-2">Inactive Enrollment</div>
                    <div className="space-y-2">
                        {inactiveEnrollmentInfo.map((enroll: any) => (
                            <div key={enroll.id} className="border rounded p-4 bg-muted">
                                <div className="font-semibold">{enroll.class?.className} - {enroll.section?.sectionName} ({enroll.department?.departmentName})</div>
                                <div>Enrollment Date: {enroll.enrollmentDate?.slice(0, 10)}</div>
                                <div>Total Fees: {enroll.totalFees}</div>
                                <div>Discount: {enroll.discount} {enroll.discountType}</div>
                                <div>Net Fees: {enroll.netFees}</div>
                                <div>Remarks: {enroll.remarks}</div>
                                <div className="text-xs text-muted-foreground">Created By: {enroll.createdBy?.fullName} on {enroll.createdAt?.slice(0, 10)}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}