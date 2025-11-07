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
// Added shadcn Select components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Document Card Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export default function UserSlugPage() {
    const params = useParams();
    const slug = params?.slug;
    const userId = typeof slug === "string" ? decryptNumber(slug) : undefined;
    const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
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

    // New state for Address Update Modal
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({
        country: "Nepal",
        permanentState: "",
        permanentCity: "",
        permanentLocalGovernment: "",
        permanentWardNumber: "",
        permanentTole: "",
        permanentPostalCode: "",
        tempState: "",
        tempCity: "",
        tempLocalGovernment: "",
        tempWardNumber: "",
        tempTole: "",
        tempPostalCode: ""
    });
    // Chained selects data for provinces -> districts -> municipals
    const [provinceOptions, setProvinceOptions] = useState<string[]>([]);
    const [permDistrictOptions, setPermDistrictOptions] = useState<string[]>([]);
    const [permMunicipalOptions, setPermMunicipalOptions] = useState<string[]>([]);
    const [tempDistrictOptions, setTempDistrictOptions] = useState<string[]>([]);
    const [tempMunicipalOptions, setTempMunicipalOptions] = useState<string[]>([]);

    // track address update in-flight
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

    const loadJSON = async (path: string) => {
        try {
            const res = await fetch(path);
            if (!res.ok) return [];
            const json = await res.json();
            // Some files may return { provinces: [...] } or { districts: [...] } or { municipals: [...] }
            if (Array.isArray(json)) return json;
            if (json.provinces) return json.provinces;
            if (json.districts) return json.districts;
            if (json.municipals) return json.municipals;
            return [];
        } catch (err) {
            console.error("loadJSON error", err);
            return [];
        }
    };

    const slugify = (s: string) =>
        s?.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-");

    // Load provinces once
    useEffect(() => {
        (async () => {
            const p = await loadJSON('/data/provinces.json');
            setProvinceOptions(p as string[]);
        })();
    }, []);

    // Permanent: load districts when province changes
    useEffect(() => {
        (async () => {
            const prov = addressForm.permanentState;
            if (!prov) {
                setPermDistrictOptions([]);
                setPermMunicipalOptions([]);
                return;
            }
            const ds = await loadJSON(`/data/districtsByProvince/${slugify(prov)}.json`);
            setPermDistrictOptions(ds as string[]);
            // If the current permanentCity is not in new districts, clear it
            if (addressForm.permanentCity && !(ds as string[]).includes(addressForm.permanentCity)) {
                setAddressForm(prev => ({ ...prev, permanentCity: '', permanentLocalGovernment: '' }));
                setPermMunicipalOptions([]);
            }
        })();
    }, [addressForm.permanentState, addressForm.permanentCity]);

    // Permanent: load municipals when district(called city) changes
    useEffect(() => {
        (async () => {
            const city = addressForm.permanentCity;
            if (!city) {
                setPermMunicipalOptions([]);
                return;
            }
            const ms = await loadJSON(`/data/municipalsByDistrict/${slugify(city)}.json`);
            setPermMunicipalOptions(ms as string[]);
            if (addressForm.permanentLocalGovernment && !(ms as string[]).includes(addressForm.permanentLocalGovernment)) {
                setAddressForm(prev => ({ ...prev, permanentLocalGovernment: '' }));
            }
        })();
    }, [addressForm.permanentCity, addressForm.permanentLocalGovernment]);

    // Temporary: districts when tempState changes
    useEffect(() => {
        (async () => {
            const prov = addressForm.tempState;
            if (!prov) {
                setTempDistrictOptions([]);
                setTempMunicipalOptions([]);
                return;
            }
            const ds = await loadJSON(`/data/districtsByProvince/${slugify(prov)}.json`);
            setTempDistrictOptions(ds as string[]);
            if (addressForm.tempCity && !(ds as string[]).includes(addressForm.tempCity)) {
                setAddressForm(prev => ({ ...prev, tempCity: '', tempLocalGovernment: '' }));
                setTempMunicipalOptions([]);
            }
        })();
    }, [addressForm.tempState, addressForm.tempCity]);

    // Temporary: municipals when tempCity changes
    useEffect(() => {
        (async () => {
            const city = addressForm.tempCity;
            if (!city) {
                setTempMunicipalOptions([]);
                return;
            }
            const ms = await loadJSON(`/data/municipalsByDistrict/${slugify(city)}.json`);
            setTempMunicipalOptions(ms as string[]);
            if (addressForm.tempLocalGovernment && !(ms as string[]).includes(addressForm.tempLocalGovernment)) {
                setAddressForm(prev => ({ ...prev, tempLocalGovernment: '' }));
            }
        })();
    }, [addressForm.tempCity, addressForm.tempLocalGovernment]);

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
                console.error(err);
                setError("Failed to fetch data");
            }
            setLoading(false);
        }
        if (userId) fetchData();
    }, [userId]);

    // Utility: show a toast for each missing field label
    const notifyMissing = (labels: string[]) => {
        labels.forEach((label) =>
            toast({ title: "Validation error", description: `${label} field is empty`, variant: "destructive" })
        );
    };

    const handleUpdateInfo = async () => {
        // All fields are mandatory: Email, Date of Birth
        const missing: string[] = [];
        if (!updateForm.email?.trim()) missing.push("Email");
        if (!updateForm.dob?.trim()) missing.push("Date of Birth");
        if (missing.length) {
            notifyMissing(missing);
            return;
        }

        setIsUpdating(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: any = { email: updateForm.email, dob: updateForm.dob };
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
            console.error(err);
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

    // New: open address modal prefill
    const openAddressModal = () => {
        setAddressForm({
            country: addressInfo?.country || "Nepal",
            permanentState: addressInfo?.permanentState || "",
            permanentCity: addressInfo?.permanentCity || "",
            permanentLocalGovernment: addressInfo?.permanentLocalGovernment || "",
            permanentWardNumber: addressInfo?.permanentWardNumber || "",
            permanentTole: addressInfo?.permanentTole || "",
            permanentPostalCode: addressInfo?.permanentPostalCode || "",
            tempState: addressInfo?.tempState || "",
            tempCity: addressInfo?.tempCity || "",
            tempLocalGovernment: addressInfo?.tempLocalGovernment || "",
            tempWardNumber: addressInfo?.tempWardNumber || "",
            tempTole: addressInfo?.tempTole || "",
            tempPostalCode: addressInfo?.tempPostalCode || ""
        });
        setIsAddressModalOpen(true);
    };

    const handleUpdateGuardianInfo = async () => {
        // All fields are mandatory in guardian form
        const requiredLabelsByKey: Record<string, string> = {
            fatherName: "Father Name",
            fatherNumber: "Father Contact",
            motherName: "Mother Name",
            motherNumber: "Mother Contact",
            grandfatherName: "Grandfather Name",
            // grandmotherName is optional
            guardianName: "Guardian Name",
            guardianContact: "Guardian Contact",
            emergencyContact: "Emergency Contact",
        };
        const missing: string[] = Object.entries(requiredLabelsByKey)
            .filter(([key]) => !(guardianUpdateForm as Record<string, string>)[key]?.trim())
            .map(([, label]) => label);
        if (missing.length) {
            notifyMissing(missing);
            return;
        }

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
            console.error(err);
            toast({
                title: "Error",
                description: "Failed to update guardian information",
                variant: "destructive",
            });
        }
        setIsUpdatingGuardian(false);
    };

    // New: handle update address info
    const handleUpdateAddress = async () => {
        // All fields are mandatory in address form
        const labelsByKey: Record<keyof typeof addressForm, string> = {
            country: "Country",
            permanentState: "Permanent State",
            permanentCity: "Permanent City",
            permanentLocalGovernment: "Permanent Local Government",
            permanentWardNumber: "Permanent Ward Number",
            permanentTole: "Permanent Tole",
            permanentPostalCode: "Permanent Postal Code",
            tempState: "Temporary State",
            tempCity: "Temporary City",
            tempLocalGovernment: "Temporary Local Government",
            tempWardNumber: "Temporary Ward Number",
            tempTole: "Temporary Tole",
            tempPostalCode: "Temporary Postal Code",
        };
        const missing: string[] = (Object.keys(labelsByKey) as Array<keyof typeof addressForm>)
            .filter((key) => !addressForm[key]?.trim())
            .map((key) => labelsByKey[key]);
        if (missing.length) {
            notifyMissing(missing);
            return;
        }

        setIsUpdatingAddress(true);
        try {
            const res = await apiHandler({
                url: `/api/v1/users/update-address-info/${userId}`,
                method: "PUT",
                data: addressForm
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: "Address information updated successfully",
                    variant: "success",
                });
                setIsAddressModalOpen(false);
                // Refresh user data
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
                    description: res.message || "Failed to update address information",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "Failed to update address information",
                variant: "destructive",
            });
        }
        setIsUpdatingAddress(false);
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
    // Cast to any for convenient property access from API response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ud: any = userData;
    const { personalInfo, guardianInfo, addressInfo, accountStatus, accountCreatedUpdatedInfo, userDocumentInfo, enrollmentInfo, inactiveEnrollmentInfo } = ud;

    // Create local lists (typed any) to avoid placing eslint-disable comments inside JSX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrollmentList: any[] = enrollmentInfo || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inactiveEnrollmentList: any[] = inactiveEnrollmentInfo || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDocsList: any[] = userDocumentInfo || [];
     return (
         <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{personalInfo.name}</h2>
                    <p className="text-sm text-muted-foreground">{toSentenceCase(personalInfo.role)} | {toSentenceCase(personalInfo.sex)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant='default' size="sm" className="cursor-pointer">Canvas</Button>
                    <Button variant='default' size="sm" className="cursor-pointer">Gallery</Button>
                    <Button variant='default' size="sm" className="cursor-pointer">View Report</Button>
                    <Button variant='default' size="sm" className="cursor-pointer">Pay Bill</Button>
                </div>
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
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Active Enrollment
                            </div>
                            <div>
                                <Button variant="default" size="sm" className="cursor-pointer">Upgrade</Button>
                            </div>
                        </CardTitle>

                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            {enrollmentList.map((enroll) => (
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
                                <span className="font-medium">Grandfather:</span>
                                <span>{guardianInfo.grandfatherName}</span>
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


                        </div>
                        <div className="space-y-3">
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
                                <span className="font-medium">Grandmother:</span>
                                <span>{guardianInfo.grandmotherName ? guardianInfo.grandmotherName : 'N/A'}</span>
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
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Address Information
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={openAddressModal}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Update Info
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                            {userDocsList.map((doc) => (
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
                            {inactiveEnrollmentList.map((enroll) => (
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
                            Update guardian and family information. All fields are required, except Grandmother Name.
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
                                <Label htmlFor="fatherNumber">Father Contact *</Label>
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
                                <Label htmlFor="motherNumber">Mother Contact *</Label>
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
                                <Label htmlFor="grandmotherName">Grandmother Name</Label>
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

            {/* Update Address Modal */}
            <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update Address Information</DialogTitle>
                        <DialogDescription>
                            Update permanent and temporary address.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 pb-4">
                        <div className="hidden">
                            <div className="space-y-2 w-full">
                                <Label htmlFor="country">Country</Label>
                                {/* Use shadcn Input (hidden group anyway) */}
                                <Input id="country" value={addressForm.country} readOnly disabled className="bg-gray-50" />
                            </div>
                        </div>

                        <h4 className="font-semibold">Permanent Address</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="permanentState">State (Province)</Label>
                                <Select
                                    value={addressForm.permanentState || undefined}
                                    onValueChange={(value) =>
                                        setAddressForm(prev => ({ ...prev, permanentState: value, permanentCity: '', permanentLocalGovernment: '' }))
                                    }
                                >
                                    <SelectTrigger id="permanentState" className="w-full">
                                        <SelectValue placeholder="Select province" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinceOptions.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permanentCity">City (District)</Label>
                                <Select
                                    value={addressForm.permanentCity || undefined}
                                    onValueChange={(value) =>
                                        setAddressForm(prev => ({ ...prev, permanentCity: value, permanentLocalGovernment: '' }))
                                    }
                                >
                                    <SelectTrigger id="permanentCity" className="w-full" disabled={!permDistrictOptions.length}>
                                        <SelectValue placeholder="Select district" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {permDistrictOptions.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="permanentLocalGovernment">Local Government (Municipal)</Label>
                                <Select
                                    value={addressForm.permanentLocalGovernment || undefined}
                                    onValueChange={(value) => setAddressForm(prev => ({ ...prev, permanentLocalGovernment: value }))}
                                >
                                    <SelectTrigger id="permanentLocalGovernment" className="w-full" disabled={!permMunicipalOptions.length}>
                                        <SelectValue placeholder="Select municipal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {permMunicipalOptions.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permanentWardNumber">Ward Number</Label>
                                <Input id="permanentWardNumber" value={addressForm.permanentWardNumber} onChange={(e) => setAddressForm(prev => ({ ...prev, permanentWardNumber: e.target.value }))} />
                            </div>
                        </div>
                        {/* Added: Permanent Tole & Postal Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="permanentTole">Tole</Label>
                                <Input id="permanentTole" value={addressForm.permanentTole} onChange={(e) => setAddressForm(prev => ({ ...prev, permanentTole: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permanentPostalCode">Postal Code</Label>
                                <Input id="permanentPostalCode" value={addressForm.permanentPostalCode} onChange={(e) => setAddressForm(prev => ({ ...prev, permanentPostalCode: e.target.value }))} />
                            </div>
                        </div>

                        <h4 className="font-semibold">Temporary Address</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tempState">State (Province)</Label>
                                <Select
                                    value={addressForm.tempState || undefined}
                                    onValueChange={(value) => setAddressForm(prev => ({ ...prev, tempState: value, tempCity: '', tempLocalGovernment: '' }))
                                    }
                                >
                                    <SelectTrigger id="tempState" className="w-full">
                                        <SelectValue placeholder="Select province" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinceOptions.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tempCity">City (District)</Label>
                                <Select
                                    value={addressForm.tempCity || undefined}
                                    onValueChange={(value) => setAddressForm(prev => ({ ...prev, tempCity: value, tempLocalGovernment: '' }))
                                    }
                                >
                                    <SelectTrigger id="tempCity" className="w-full" disabled={!tempDistrictOptions.length}>
                                        <SelectValue placeholder="Select district" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tempDistrictOptions.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tempLocalGovernment">Local Government (Municipal)</Label>
                                <Select
                                    value={addressForm.tempLocalGovernment || undefined}
                                    onValueChange={(value) => setAddressForm(prev => ({ ...prev, tempLocalGovernment: value }))}
                                >
                                    <SelectTrigger id="tempLocalGovernment" className="w-full" disabled={!tempMunicipalOptions.length}>
                                        <SelectValue placeholder="Select municipal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tempMunicipalOptions.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tempWardNumber">Ward Number</Label>
                                <Input id="tempWardNumber" value={addressForm.tempWardNumber} onChange={(e) => setAddressForm(prev => ({ ...prev, tempWardNumber: e.target.value }))} />
                            </div>
                        </div>
                        {/* Added: Temporary Tole & Postal Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tempTole">Tole</Label>
                                <Input id="tempTole" value={addressForm.tempTole} onChange={(e) => setAddressForm(prev => ({ ...prev, tempTole: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tempPostalCode">Postal Code</Label>
                                <Input id="tempPostalCode" value={addressForm.tempPostalCode} onChange={(e) => setAddressForm(prev => ({ ...prev, tempPostalCode: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddressModalOpen(false)} disabled={isUpdatingAddress}>Cancel</Button>
                        <Button onClick={handleUpdateAddress} disabled={isUpdatingAddress}>{isUpdatingAddress ? 'Updating...' : 'Update Address'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
